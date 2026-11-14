<?php
/*
 * PRODUCTS - GET
 *   api/products.php                 all products (optional ?category=keychain, ?search=word)
 *   api/products.php?id=2            one product + gallery + other designs + "you may also like"
 */

declare(strict_types=1);

require __DIR__ . '/../includes/bootstrap.php';

require_method('GET');

$pdo = db();
$favouriteIds = favourite_ids(current_user_id());

// ---------- Single product ----------
if (isset($_GET['id'])) {
    $productId = positive_int($_GET['id']);
    $row = $productId ? find_active_product($productId) : null;

    if (!$row) {
        json_error('Product not found.', 404);
    }

    $stmt = $pdo->prepare(
        'SELECT image_path FROM product_images WHERE product_id = ? ORDER BY sort_order, id'
    );
    $stmt->execute([$productId]);
    $images = $stmt->fetchAll(PDO::FETCH_COLUMN) ?: [$row['image']];

    $stmt = $pdo->prepare(
        'SELECT * FROM products
         WHERE is_active = 1 AND id <> ? AND category = ?
         ORDER BY id LIMIT 6'
    );
    $stmt->execute([$productId, $row['category']]);
    $otherDesigns = array_map(fn ($p) => product_payload($p, $favouriteIds), $stmt->fetchAll());

    $stmt = $pdo->prepare(
        'SELECT * FROM products
         WHERE is_active = 1 AND id <> ? AND category <> ?
         ORDER BY RAND() LIMIT 4'
    );
    $stmt->execute([$productId, $row['category']]);
    $related = array_map(fn ($p) => product_payload($p, $favouriteIds), $stmt->fetchAll());

    $product = product_payload($row, $favouriteIds);
    $product['images'] = $images;

    json_response([
        'success'      => true,
        'product'      => $product,
        'otherDesigns' => $otherDesigns,
        'related'      => $related,
    ]);
}

// ---------- Product list ----------
$where = ['is_active = 1'];
$params = [];

$category = clean_text($_GET['category'] ?? '');
if ($category !== '' && in_array($category, PRODUCT_CATEGORIES, true)) {
    $where[] = 'category = ?';
    $params[] = $category;
}

$search = clean_text($_GET['search'] ?? '');
if ($search !== '') {
    $like = '%' . addcslashes($search, '%_\\') . '%';
    $where[] = '(name LIKE ? OR description LIKE ? OR category LIKE ?)';
    array_push($params, $like, $like, $like);
}

$stmt = $pdo->prepare(
    'SELECT * FROM products WHERE ' . implode(' AND ', $where) . ' ORDER BY category, id'
);
$stmt->execute($params);

json_response([
    'success'  => true,
    'products' => array_map(fn ($p) => product_payload($p, $favouriteIds), $stmt->fetchAll()),
]);
