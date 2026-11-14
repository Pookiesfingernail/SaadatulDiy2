<?php
/*
 * SHARED BACKEND HELPERS - SA'ADATUL D.I.Y
 * Every file in api/ starts with: require __DIR__ . '/../includes/bootstrap.php';
 * It sets up JSON responses, the login session and common helper functions.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

set_exception_handler(function (Throwable $error): void {
    error_log('[SaadatulDIY] ' . $error);

    $message = $error instanceof PDOException
        ? 'Database error. Please make sure MySQL is running in XAMPP and the saadatuldiy2_db database has been imported.'
        : 'Something went wrong on the server. Please try again.';

    if (!headers_sent()) {
        http_response_code(500);
    }

    echo json_encode(['success' => false, 'message' => $message]);
});

// ---------------------------------------------------------
//  SESSION (keeps the customer logged in)
// ---------------------------------------------------------
session_name('SDIYSESSID');
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true,
    'samesite' => 'Lax',
]);
ini_set('session.use_strict_mode', '1');
session_start();

// ---------------------------------------------------------
//  JSON RESPONSES
// ---------------------------------------------------------
function json_response(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $message, int $status = 400, array $extra = []): never
{
    json_response(['success' => false, 'message' => $message] + $extra, $status);
}

function request_method(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function require_method(string ...$methods): string
{
    $method = request_method();

    if (!in_array($method, $methods, true)) {
        header('Allow: ' . implode(', ', $methods));
        json_error('Method not allowed.', 405);
    }

    return $method;
}

/** Reads a JSON request body. Only same-site pages can send JSON with the login cookie. */
function read_json(): array
{
    $type = $_SERVER['CONTENT_TYPE'] ?? '';

    if (stripos($type, 'application/json') !== 0) {
        json_error('Requests must be sent as JSON.', 415);
    }

    $data = json_decode((string) file_get_contents('php://input'), true);

    if (!is_array($data)) {
        json_error('Invalid request data.');
    }

    return $data;
}

/** Blocks form posts that come from other websites (CSRF protection). */
function check_same_origin(): void
{
    if (request_method() === 'GET') {
        return;
    }

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ($origin === '' || $origin === 'null') {
        return;
    }

    $host = parse_url($origin, PHP_URL_HOST);
    $port = parse_url($origin, PHP_URL_PORT);
    $originHost = $host . ($port ? ':' . $port : '');

    if (strcasecmp($originHost, $_SERVER['HTTP_HOST'] ?? '') !== 0) {
        json_error('Request blocked.', 403);
    }
}

check_same_origin();

// ---------------------------------------------------------
//  INPUT HELPERS
// ---------------------------------------------------------
function clean_text(mixed $value): string
{
    if (!is_scalar($value)) {
        return '';
    }

    $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string) $value) ?? '';

    return trim($text);
}

function text_length(string $text): int
{
    return (int) preg_match_all('/./us', $text);
}

function positive_int(mixed $value): ?int
{
    $number = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

    return $number === false ? null : $number;
}

function money(float $amount): string
{
    return number_format($amount, 2, '.', '');
}

// ---------------------------------------------------------
//  LOGIN HELPERS
// ---------------------------------------------------------
function current_user_id(): ?int
{
    $id = $_SESSION['user_id'] ?? null;

    return is_int($id) && $id > 0 ? $id : null;
}

function current_user(): ?array
{
    $id = current_user_id();

    if ($id === null) {
        return null;
    }

    $stmt = db()->prepare(
        'SELECT id, full_name, email, phone, address, city, postcode, created_at
         FROM users WHERE id = ?'
    );
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    if (!$user) {
        unset($_SESSION['user_id']);
        return null;
    }

    return user_payload($user);
}

/** Stops the request with 401 when the customer is not logged in. */
function require_login(): int
{
    $id = current_user_id();

    if ($id === null || current_user() === null) {
        json_error('Please log in or sign up to continue.', 401, ['loginRequired' => true]);
    }

    return $id;
}

function log_in_user(int $userId): void
{
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;
}

function user_payload(array $user): array
{
    return [
        'id'        => (int) $user['id'],
        'full_name' => $user['full_name'],
        'email'     => $user['email'],
        'phone'     => $user['phone'] ?? null,
        'address'   => $user['address'] ?? null,
        'city'      => $user['city'] ?? null,
        'postcode'  => $user['postcode'] ?? null,
        'createdAt' => $user['created_at'] ?? null,
    ];
}

// ---------------------------------------------------------
//  PRODUCT & CART HELPERS
// ---------------------------------------------------------
const PRODUCT_CATEGORIES = ['keychain', 'figurine', 'plushie', 'accessory'];

function product_payload(array $row, array $favouriteIds = []): array
{
    $id = (int) $row['id'];

    return [
        'id'          => $id,
        'name'        => $row['name'],
        'category'    => $row['category'],
        'price'       => (float) $row['price'],
        'description' => $row['description'],
        'image'       => $row['image'],
        'stock'       => $row['stock'] === null ? null : (int) $row['stock'],
        'isFavourite' => in_array($id, $favouriteIds, true),
    ];
}

function favourite_ids(?int $userId): array
{
    if ($userId === null) {
        return [];
    }

    $stmt = db()->prepare('SELECT product_id FROM favourites WHERE user_id = ?');
    $stmt->execute([$userId]);

    return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
}

function find_active_product(int $productId): ?array
{
    $stmt = db()->prepare('SELECT * FROM products WHERE id = ? AND is_active = 1');
    $stmt->execute([$productId]);

    return $stmt->fetch() ?: null;
}

function cart_summary(int $userId): array
{
    $stmt = db()->prepare(
        'SELECT p.id, p.name, p.category, p.price, p.image, p.stock, ci.quantity
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id AND p.is_active = 1
         WHERE ci.user_id = ?
         ORDER BY ci.added_at, ci.id'
    );
    $stmt->execute([$userId]);

    $items = [];
    $subtotal = 0.0;
    $count = 0;

    foreach ($stmt->fetchAll() as $row) {
        $price = (float) $row['price'];
        $quantity = (int) $row['quantity'];
        $lineTotal = round($price * $quantity, 2);

        $items[] = [
            'productId' => (int) $row['id'],
            'name'      => $row['name'],
            'category'  => $row['category'],
            'price'     => $price,
            'image'     => $row['image'],
            'stock'     => $row['stock'] === null ? null : (int) $row['stock'],
            'quantity'  => $quantity,
            'lineTotal' => $lineTotal,
        ];

        $subtotal += $lineTotal;
        $count += $quantity;
    }

    return [
        'items'    => $items,
        'subtotal' => round($subtotal, 2),
        'count'    => $count,
    ];
}
