<?php
/*
 * LOGIN STATUS - GET
 * Used by js/global.js on every page (account dropdown + cart badge).
 */

declare(strict_types=1);

require __DIR__ . '/../includes/bootstrap.php';

require_method('GET');

$user = current_user();

json_response([
    'success'   => true,
    'loggedIn'  => $user !== null,
    'user'      => $user,
    'cartCount' => $user ? cart_summary($user['id'])['count'] : 0,
]);
