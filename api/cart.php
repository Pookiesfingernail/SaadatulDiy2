<?php
/*
 * SHOPPING CART (login required) - saved in the cart_items table
 *   GET                                  list cart items
 *   POST   JSON { product_id, quantity }  add to cart (adds to existing quantity)
 *   PATCH  JSON { product_id, quantity }  change quantity
 *   DELETE JSON { product_id }            remove item
 */

declare(strict_types=1);

require __DIR__ . '/../includes/bootstrap.php';

const MAX_QUANTITY = 99;

$userId = require_login();
$method = require_method('GET', 'POST', 'PATCH', 'DELETE');
$pdo = db();

if ($method === 'GET') {
    json_response(['success' => true] + cart_summary($userId));
}

$data = read_json();
$productId = positive_int($data['product_id'] ?? null);

if ($productId === null) {
    json_error('Please choose a product.', 422);
}

if ($method === 'DELETE') {
    $pdo->prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?')
        ->execute([$userId, $productId]);

    json_response(['success' => true, 'message' => 'Item removed from your cart.'] + cart_summary($userId));
}

$quantity = positive_int($data['quantity'] ?? 1);

if ($quantity === null || $quantity > MAX_QUANTITY) {
    json_error('Please choose a quantity between 1 and ' . MAX_QUANTITY . '.', 422);
}

$product = find_active_product($productId);

if (!$product) {
    json_error('This product is no longer available.', 404);
}

$stmt = $pdo->prepare('SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?');
$stmt->execute([$userId, $productId]);
$inCart = (int) ($stmt->fetchColumn() ?: 0);

$newQuantity = $method === 'POST' ? $inCart + $quantity : $quantity;

if ($newQuantity > MAX_QUANTITY) {
    json_error('You can only have up to ' . MAX_QUANTITY . ' of this item in your cart.', 422);
}

if ($product['stock'] !== null && $newQuantity > (int) $product['stock']) {
    $stock = (int) $product['stock'];
    $message = $stock === 0
        ? 'Sorry, this item is out of stock.'
        : 'Sorry, only ' . $stock . ' left in stock' . ($inCart ? ' (you already have ' . $inCart . ' in your cart).' : '.');

    json_error($message, 409);
}

$pdo->prepare(
    'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)'
)->execute([$userId, $productId, $newQuantity]);

json_response([
    'success' => true,
    'message' => $method === 'POST' ? $product['name'] . ' added to your cart.' : 'Cart updated.',
] + cart_summary($userId));
