<?php
/*
 * LOG OUT - POST
 */

declare(strict_types=1);

require __DIR__ . '/../includes/bootstrap.php';

require_method('POST');

$_SESSION = [];

$cookie = session_get_cookie_params();
setcookie(session_name(), '', [
    'expires'  => time() - 3600,
    'path'     => $cookie['path'],
    'secure'   => $cookie['secure'],
    'httponly' => $cookie['httponly'],
    'samesite' => $cookie['samesite'],
]);

session_destroy();

json_response(['success' => true, 'message' => 'You have been logged out.']);
