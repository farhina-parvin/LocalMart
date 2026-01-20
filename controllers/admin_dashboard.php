<?php
// controllers/admin_dashboard.php
session_start();

function refresh_auth_cookies_from_session(): void {
    if (!isset($_SESSION["role"], $_SESSION["name"])) return;

    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    $expires = time() + (60 * 60 * 24 * 7);

    setcookie("lm_role", $_SESSION["role"], [
        "expires"  => $expires,
        "path"     => "/",
        "secure"   => $secure,
        "httponly" => true,
        "samesite" => "Lax",
    ]);

    setcookie("lm_name", $_SESSION["name"], [
        "expires"  => $expires,
        "path"     => "/",
        "secure"   => $secure,
        "httponly" => true,
        "samesite" => "Lax",
    ]);
}

if (!isset($_SESSION["user_id"]) || (($_SESSION["role"] ?? "") !== "admin")) {
    header("Location: /LocalMart/view/html/login.html");
    exit;
}

refresh_auth_cookies_from_session();

header("Location: /LocalMart/view/html/admin.html");
exit;
