<?php
/*
 * PROFILE SETTINGS (login required)
 *   GET                                                          profile details
 *   POST JSON { action: "update", full_name, email, phone, address, city, postcode }
 *   POST JSON { action: "password", current_password, new_password }
 */

declare(strict_types=1);

require __DIR__ . '/../includes/bootstrap.php';

$userId = require_login();
$method = require_method('GET', 'POST');
$pdo = db();

if ($method === 'GET') {
    json_response(['success' => true, 'user' => current_user()]);
}

$data = read_json();
$action = $data['action'] ?? 'update';

if ($action === 'password') {
    $current = is_string($data['current_password'] ?? null) ? $data['current_password'] : '';
    $new = is_string($data['new_password'] ?? null) ? $data['new_password'] : '';

    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
    $stmt->execute([$userId]);

    if (!password_verify($current, (string) $stmt->fetchColumn())) {
        json_error('Your current password is incorrect.', 422, ['errors' => ['current_password' => 'Your current password is incorrect.']]);
    }
    if (strlen($new) < 8 || strlen($new) > 72) {
        json_error('New password must be 8 to 72 characters.', 422, ['errors' => ['new_password' => 'New password must be 8 to 72 characters.']]);
    }

    $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($new, PASSWORD_DEFAULT), $userId]);

    session_regenerate_id(true);

    json_response(['success' => true, 'message' => 'Your password has been changed.']);
}

if ($action !== 'update') {
    json_error('Unknown action.');
}

$fields = [
    'full_name' => clean_text($data['full_name'] ?? ''),
    'email'     => strtolower(clean_text($data['email'] ?? '')),
    'phone'     => clean_text($data['phone'] ?? ''),
    'address'   => clean_text($data['address'] ?? ''),
    'city'      => clean_text($data['city'] ?? ''),
    'postcode'  => clean_text($data['postcode'] ?? ''),
];

$errors = [];

if (text_length($fields['full_name']) < 2 || text_length($fields['full_name']) > 100) {
    $errors['full_name'] = 'Please enter your full name.';
}
if (strlen($fields['email']) > 254 || !filter_var($fields['email'], FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Please enter a valid email address.';
}
if ($fields['phone'] !== '' && !preg_match('/^\+?[0-9\s\-()]{7,20}$/', $fields['phone'])) {
    $errors['phone'] = 'Please enter a valid phone number.';
}
if (text_length($fields['address']) > 255) {
    $errors['address'] = 'Address is too long.';
}
if (text_length($fields['city']) > 100) {
    $errors['city'] = 'City is too long.';
}
if (text_length($fields['postcode']) > 20) {
    $errors['postcode'] = 'Postcode is too long.';
}

if (!$errors) {
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id <> ?');
    $stmt->execute([$fields['email'], $userId]);
    if ($stmt->fetch()) {
        $errors['email'] = 'Another account already uses this email.';
    }
}

if ($errors) {
    json_error(reset($errors), 422, ['errors' => $errors]);
}

$pdo->prepare(
    'UPDATE users SET full_name = ?, email = ?, phone = ?, address = ?, city = ?, postcode = ? WHERE id = ?'
)->execute([
    $fields['full_name'],
    $fields['email'],
    $fields['phone'] === '' ? null : $fields['phone'],
    $fields['address'] === '' ? null : $fields['address'],
    $fields['city'] === '' ? null : $fields['city'],
    $fields['postcode'] === '' ? null : $fields['postcode'],
    $userId,
]);

json_response([
    'success' => true,
    'message' => 'Your profile has been updated.',
    'user'    => current_user(),
]);
