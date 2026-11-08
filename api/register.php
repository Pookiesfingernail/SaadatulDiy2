<?php
/*
 * SIGN UP - POST JSON { full_name, email, password }
 * Creates the customer account (password is hashed) and logs them in.
 */

declare(strict_types=1);

require __DIR__ . '/../includes/bootstrap.php';

require_method('POST');
$data = read_json();

$fullName = clean_text($data['full_name'] ?? '');
$email = strtolower(clean_text($data['email'] ?? ''));
$password = is_string($data['password'] ?? null) ? $data['password'] : '';

$errors = [];

if (text_length($fullName) < 2 || text_length($fullName) > 100) {
    $errors['full_name'] = 'Please enter your full name.';
}

if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Please enter a valid email address.';
}

if (strlen($password) < 8) {
    $errors['password'] = 'Password must contain at least 8 characters.';
} elseif (strlen($password) > 72) {
    $errors['password'] = 'Password must be 72 characters or fewer.';
}

if ($errors) {
    json_error(reset($errors), 422, ['errors' => $errors]);
}

$pdo = db();
$duplicateMessage = 'An account with this email already exists. Please log in instead.';

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);

if ($stmt->fetch()) {
    json_error($duplicateMessage, 409, ['errors' => ['email' => $duplicateMessage]]);
}

try {
    $stmt = $pdo->prepare(
        'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)'
    );
    $stmt->execute([$fullName, $email, password_hash($password, PASSWORD_DEFAULT)]);
} catch (PDOException $error) {
    if ($error->getCode() === '23000') {
        json_error($duplicateMessage, 409, ['errors' => ['email' => $duplicateMessage]]);
    }
    throw $error;
}

log_in_user((int) $pdo->lastInsertId());

json_response([
    'success' => true,
    'message' => 'Account created successfully!',
    'user'    => current_user(),
], 201);
