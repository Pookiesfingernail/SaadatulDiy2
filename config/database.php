<?php
/*
 * DATABASE SETTINGS - SA'ADATUL D.I.Y
 * XAMPP default login is user "root" with no password.
 * To use different settings on one computer without changing this file,
 * create config/database.local.php and define the constants there.
 */

declare(strict_types=1);

if (is_file(__DIR__ . '/database.local.php')) {
    require __DIR__ . '/database.local.php';
}

defined('DB_HOST') || define('DB_HOST', 'localhost');
defined('DB_PORT') || define('DB_PORT', 3306);
defined('DB_NAME') || define('DB_NAME', 'saadatuldiy2_db');
defined('DB_USER') || define('DB_USER', 'root');
defined('DB_PASS') || define('DB_PASS', '');

date_default_timezone_set('Asia/Brunei');

// WhatsApp number that receives custom orders (country code + number, digits only).
defined('WHATSAPP_NUMBER') || define('WHATSAPP_NUMBER', '6738282379');

function db(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            DB_HOST,
            DB_PORT,
            DB_NAME
        );

        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }

    return $pdo;
}
