<?php
// controllers/seller_dashboard.php
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

if (!isset($_SESSION["user_id"])) {
    header("Location: /LocalMart/view/html/login.html");
    exit();
}

$role = $_SESSION["role"] ?? "";
if ($role !== "seller") {
    header("Location: /LocalMart/controllers/buyer_dashboard.php");
    exit();
}

refresh_auth_cookies_from_session();

header("Location: /LocalMart/view/html/seller.html");
exit();
