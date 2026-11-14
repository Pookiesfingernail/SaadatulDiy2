<?php
/*
 * FAVOURITE ITEMS (login required) - saved in the favourites table
 *   GET                         list favourites
 *   POST   JSON { product_id }  add to favourites
 *   DELETE JSON { product_id }  remove from favourites
 */

declare(strict_types=1);

require __DIR__ . '/../includes/bootstrap.php';

$userId = require_login();
$method = require_method('GET', 'POST', 'DELETE');
$pdo = db();

function list_favourites(int $userId): array
{
    $stmt = db()->prepare(
        'SELECT p.* FROM favourites f
         JOIN products p ON p.id = f.product_id AND p.is_active = 1
         WHERE f.user_id = ?
         ORDER BY f.created_at DESC'
    );
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();
    $ids = array_map(fn ($row) => (int) $row['id'], $rows);

    return array_map(fn ($row) => product_payload($row, $ids), $rows);
}

if ($method === 'GET') {
    json_response(['success' => true, 'favourites' => list_favourites($userId)]);
}

$data = read_json();
$productId = positive_int($data['product_id'] ?? null);

if ($productId === null) {
    json_error('Please choose a product.', 422);
}

if ($method === 'POST') {
    $product = find_active_product($productId);

    if (!$product) {
        json_error('This product is no longer available.', 404);
    }

    $pdo->prepare('INSERT IGNORE INTO favourites (user_id, product_id) VALUES (?, ?)')
        ->execute([$userId, $productId]);

    $message = $product['name'] . ' added to your favourites.';
} else {
    $pdo->prepare('DELETE FROM favourites WHERE user_id = ? AND product_id = ?')
        ->execute([$userId, $productId]);

    $message = 'Removed from your favourites.';
}

json_response([
    'success'    => true,
    'message'    => $message,
    'favourites' => list_favourites($userId),
]);
