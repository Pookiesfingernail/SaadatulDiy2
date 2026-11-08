<?php
/*
 * LOG IN - POST JSON { email, password }
 * After 5 wrong passwords for one email (or 20 from one computer)
 * the customer must wait 15 minutes.
 */

declare(strict_types=1);

require __DIR__ . '/../includes/bootstrap.php';

const MAX_FAILS_PER_EMAIL = 5;
const MAX_FAILS_PER_IP = 20;
const LOCK_MINUTES = 15;

require_method('POST');
$data = read_json();

$email = strtolower(clean_text($data['email'] ?? ''));
$password = is_string($data['password'] ?? null) ? $data['password'] : '';
$ip = substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);

if ($email === '' || $password === '') {
    json_error('Please enter your email and password.', 422);
}

$pdo = db();

$pdo->exec('DELETE FROM login_attempts WHERE attempted_at < (NOW() - INTERVAL 1 DAY)');

$stmt = $pdo->prepare(
    'SELECT
        SUM(email = ?) AS email_fails,
        SUM(ip_address = ?) AS ip_fails
     FROM login_attempts
     WHERE attempted_at > (NOW() - INTERVAL ' . LOCK_MINUTES . ' MINUTE)
       AND (email = ? OR ip_address = ?)'
);
$stmt->execute([$email, $ip, $email, $ip]);
$fails = $stmt->fetch();

if ((int) $fails['email_fails'] >= MAX_FAILS_PER_EMAIL || (int) $fails['ip_fails'] >= MAX_FAILS_PER_IP) {
    json_error('Too many failed login attempts. Please wait ' . LOCK_MINUTES . ' minutes and try again.', 429);
}

$stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    $pdo->prepare('INSERT INTO login_attempts (email, ip_address) VALUES (?, ?)')
        ->execute([$email, $ip]);

    json_error('Incorrect email or password.', 401);
}

$pdo->prepare('DELETE FROM login_attempts WHERE email = ?')->execute([$email]);

if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
    $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);
}

log_in_user((int) $user['id']);

json_response([
    'success' => true,
    'message' => 'Welcome back!',
    'user'    => current_user(),
]);
