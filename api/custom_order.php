<?php
/*
 * CUSTOM ORDER (login required) - POST JSON { keychains: [...], specialNotes }
 * Saves the request in custom_orders and returns the WhatsApp link
 * the customer is sent to so the final price can be discussed.
 */

declare(strict_types=1);

require __DIR__ . '/../includes/bootstrap.php';
require __DIR__ . '/../includes/custom-orders.php';

$userId = require_login();
require_method('POST');
$data = read_json();

[$keychains, $estimatedTotal] = validate_custom_keychains($data['keychains'] ?? null);

$specialNotes = clean_text($data['specialNotes'] ?? '');
if (text_length($specialNotes) > CUSTOM_SPECIAL_NOTE_LIMIT) {
    json_error('Special notes must be ' . CUSTOM_SPECIAL_NOTE_LIMIT . ' characters or fewer.', 422);
}

$pdo = db();
$pdo->prepare(
    'INSERT INTO custom_orders (user_id, order_type, details, special_notes, estimated_total)
     VALUES (?, ?, ?, ?, ?)'
)->execute([
    $userId,
    'keychain',
    json_encode($keychains, JSON_UNESCAPED_UNICODE),
    $specialNotes === '' ? null : $specialNotes,
    money($estimatedTotal),
]);

$orderId = (int) $pdo->lastInsertId();

json_response([
    'success'        => true,
    'message'        => 'Your custom order has been saved. Opening WhatsApp so we can confirm the final price.',
    'customOrderId'  => $orderId,
    'estimatedTotal' => $estimatedTotal,
    'whatsappUrl'    => custom_order_whatsapp_url($orderId, current_user(), $keychains, $specialNotes, $estimatedTotal),
], 201);
