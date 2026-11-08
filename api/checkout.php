<?php
/*
 * CHECKOUT (login required) - POST multipart/form-data from checkout.html
 * Fields: email, full_name, phone, country, fulfilment (delivery|pickup),
 *         address, city, postcode, shipping (5|7|9|10), proof (file)
 * Creates the order from the customer's saved cart, then empties the cart.
 */

declare(strict_types=1);

require __DIR__ . '/../includes/bootstrap.php';

const PROOF_MAX_BYTES = 5 * 1024 * 1024;
const PROOF_DIR = __DIR__ . '/../uploads/payment-proofs';

// value of the shipping radio button => [zone, fee]
const SHIPPING_ZONES = [
    '5'  => ['Brunei Muara', 5.00],
    '7'  => ['Tutong', 7.00],
    '9'  => ['Belait', 9.00],
    '10' => ['Temburong', 10.00],
];

$userId = require_login();
require_method('POST');

// ---------- Customer details ----------
$fields = [];
foreach (['email', 'full_name', 'phone', 'country', 'address', 'city', 'postcode', 'fulfilment', 'shipping'] as $name) {
    $fields[$name] = clean_text($_POST[$name] ?? '');
}

$fields['email'] = strtolower($fields['email']);
$isDelivery = $fields['fulfilment'] !== 'pickup';

$errors = [];

if (!filter_var($fields['email'], FILTER_VALIDATE_EMAIL) || strlen($fields['email']) > 254) {
    $errors['email'] = 'Please enter a valid email address.';
}
if (text_length($fields['full_name']) < 2 || text_length($fields['full_name']) > 100) {
    $errors['fullname'] = 'Please enter your full name.';
}
if (!preg_match('/^\+?[0-9\s\-()]{7,20}$/', $fields['phone'])) {
    $errors['phone'] = 'Please enter a valid phone number.';
}
if ($fields['country'] === '' || text_length($fields['country']) > 100) {
    $errors['country'] = 'Please enter your country.';
}

$zone = null;
$deliveryFee = 0.0;

if ($isDelivery) {
    if ($fields['address'] === '' || text_length($fields['address']) > 255) {
        $errors['address'] = 'Please enter your delivery address.';
    }
    if ($fields['city'] === '' || text_length($fields['city']) > 100) {
        $errors['city'] = 'Please enter your city.';
    }
    if ($fields['postcode'] === '' || text_length($fields['postcode']) > 20) {
        $errors['postcode'] = 'Please enter your postcode.';
    }
    if (!isset(SHIPPING_ZONES[$fields['shipping']])) {
        $errors['shipping'] = 'Please choose a delivery district.';
    } else {
        [$zone, $deliveryFee] = SHIPPING_ZONES[$fields['shipping']];
    }
}

if ($errors) {
    json_error(reset($errors), 422, ['errors' => $errors]);
}

// ---------- Payment screenshot ----------
$file = $_FILES['proof'] ?? null;

if (!$file || !is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
    json_error('Please upload your BIBD bank transfer screenshot before placing your order.', 422);
}
if ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE || $file['size'] > PROOF_MAX_BYTES) {
    json_error('Payment screenshot must be 5 MB or smaller.', 422);
}
if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
    json_error('The payment screenshot could not be uploaded. Please try again.', 422);
}

$head = (string) file_get_contents($file['tmp_name'], false, null, 0, 12);
$extension = match (true) {
    str_starts_with($head, "\xFF\xD8\xFF")                               => 'jpg',
    str_starts_with($head, "\x89PNG\r\n\x1A\n")                          => 'png',
    str_starts_with($head, 'GIF8')                                       => 'gif',
    str_starts_with($head, 'RIFF') && substr($head, 8, 4) === 'WEBP'     => 'webp',
    str_starts_with($head, '%PDF')                                       => 'pdf',
    default                                                              => null,
};

if ($extension === null) {
    json_error('Payment proof must be an image (JPG, PNG, GIF, WEBP) or a PDF file.', 422);
}

// ---------- Create the order ----------
$pdo = db();
$pdo->beginTransaction();

try {
    $stmt = $pdo->prepare(
        'SELECT p.id, p.name, p.price, p.image, p.stock, ci.quantity
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id AND p.is_active = 1
         WHERE ci.user_id = ?
         ORDER BY ci.added_at, ci.id
         FOR UPDATE'
    );
    $stmt->execute([$userId]);
    $items = $stmt->fetchAll();

    if (!$items) {
        $pdo->rollBack();
        json_error('Your cart is empty. Please add items from the Shop page.', 422);
    }

    $subtotal = 0.0;
    foreach ($items as $item) {
        if ($item['stock'] !== null && (int) $item['quantity'] > (int) $item['stock']) {
            $pdo->rollBack();
            json_error('Sorry, only ' . (int) $item['stock'] . ' of "' . $item['name'] . '" left in stock. Please update your cart.', 409);
        }
        $subtotal += round((float) $item['price'] * (int) $item['quantity'], 2);
    }
    $subtotal = round($subtotal, 2);
    $total = round($subtotal + $deliveryFee, 2);

    if (!is_dir(PROOF_DIR) && !mkdir(PROOF_DIR, 0750, true) && !is_dir(PROOF_DIR)) {
        throw new RuntimeException('Cannot create payment proof folder.');
    }

    $proofName = 'order-' . date('Ymd-His') . '-' . bin2hex(random_bytes(8)) . '.' . $extension;
    $proofPath = PROOF_DIR . '/' . $proofName;

    if (!move_uploaded_file($file['tmp_name'], $proofPath)) {
        throw new RuntimeException('Cannot save payment proof.');
    }

    $pdo->prepare(
        'INSERT INTO orders
            (user_id, email, full_name, phone, country, fulfilment, address, city, postcode,
             shipping_zone, subtotal, delivery_fee, total, payment_proof)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $userId,
        $fields['email'],
        $fields['full_name'],
        $fields['phone'],
        $fields['country'],
        $isDelivery ? 'delivery' : 'pickup',
        $isDelivery ? $fields['address'] : null,
        $isDelivery ? $fields['city'] : null,
        $isDelivery ? $fields['postcode'] : null,
        $zone,
        money($subtotal),
        money($deliveryFee),
        money($total),
        $proofName,
    ]);

    $orderId = (int) $pdo->lastInsertId();

    $insertItem = $pdo->prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, image, unit_price, quantity, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $reduceStock = $pdo->prepare(
        'UPDATE products SET stock = stock - ? WHERE id = ? AND stock IS NOT NULL'
    );

    foreach ($items as $item) {
        $quantity = (int) $item['quantity'];
        $insertItem->execute([
            $orderId,
            $item['id'],
            $item['name'],
            $item['image'],
            money((float) $item['price']),
            $quantity,
            money((float) $item['price'] * $quantity),
        ]);
        $reduceStock->execute([$quantity, $item['id']]);
    }

    $pdo->prepare('DELETE FROM cart_items WHERE user_id = ?')->execute([$userId]);

    // Remember delivery details for next time (only fills empty profile fields).
    $pdo->prepare(
        'UPDATE users SET
            phone    = COALESCE(NULLIF(phone, \'\'), ?),
            address  = COALESCE(NULLIF(address, \'\'), ?),
            city     = COALESCE(NULLIF(city, \'\'), ?),
            postcode = COALESCE(NULLIF(postcode, \'\'), ?)
         WHERE id = ?'
    )->execute([
        $fields['phone'],
        $isDelivery ? $fields['address'] : null,
        $isDelivery ? $fields['city'] : null,
        $isDelivery ? $fields['postcode'] : null,
        $userId,
    ]);

    $pdo->commit();
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (isset($proofPath) && is_file($proofPath)) {
        unlink($proofPath);
    }
    throw $error;
}

json_response([
    'success' => true,
    'message' => 'Thank you for your order! Your order number is #' . $orderId . '.',
    'orderId' => $orderId,
    'total'   => $total,
], 201);
