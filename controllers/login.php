<?php
// controllers/login.php
session_start();

require_once __DIR__ . "/../model/db.php";

function set_auth_cookies(string $role, string $name): void {
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    $expires = time() + (60 * 60 * 24 * 7); // 7 days

    // Role + name are NOT security-critical; session is the authority.
    setcookie("lm_role", $role, [
        "expires"  => $expires,
        "path"     => "/",
        "secure"   => $secure,
        "httponly" => true,
        "samesite" => "Lax",
    ]);

    setcookie("lm_name", $name, [
        "expires"  => $expires,
        "path"     => "/",
        "secure"   => $secure,
        "httponly" => true,
        "samesite" => "Lax",
    ]);
}

function redirect_login_error(string $msg): void {
    $_SESSION["auth_error"] = $msg;
    header("Location: /LocalMart/view/html/login.html");
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: /LocalMart/view/html/login.html");
    exit;
}

$email = trim($_POST["email"] ?? "");
$password = $_POST["password"] ?? "";
$role = trim($_POST["role"] ?? "");

if ($email === "" || $password === "" || $role === "") {
    redirect_login_error("Missing fields.");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirect_login_error("Invalid email.");
}

$allowedRoles = ["buyer", "seller", "admin"];
if (!in_array($role, $allowedRoles, true)) {
    redirect_login_error("Invalid role.");
}

if (!isset($conn) || !$conn) {
    redirect_login_error("Database connection failed.");
}

// IMPORTANT: Standardize table name to Users (matches your DB + other files)
$sql = "SELECT id, name, email, password, role FROM Users WHERE email = ? AND role = ? LIMIT 1";
$stmt = $conn->prepare($sql);
if (!$stmt) redirect_login_error("Server error (prepare).");

$stmt->bind_param("ss", $email, $role);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows !== 1) {
    $stmt->close();
    redirect_login_error("User not found.");
}

$user = $result->fetch_assoc();
$stmt->close();

if (!password_verify($password, $user["password"])) {
    redirect_login_error("Invalid password.");
}

// Success: set session (AUTHORITY)
$_SESSION["user_id"] = (int)$user["id"];
$_SESSION["name"]    = $user["name"];
$_SESSION["role"]    = $user["role"];

// Cookies (CONVENIENCE)
set_auth_cookies($_SESSION["role"], $_SESSION["name"]);

// Redirect by role
if ($user["role"] === "buyer") {
    header("Location: /LocalMart/controllers/buyer_dashboard.php");
} elseif ($user["role"] === "seller") {
    header("Location: /LocalMart/controllers/seller_dashboard.php");
} else { // admin
    header("Location: /LocalMart/controllers/admin_dashboard.php");
}
exit;
