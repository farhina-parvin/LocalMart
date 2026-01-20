<?php
// controllers/register.php
session_start();

function set_auth_cookies(string $role, string $name): void {
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    $expires = time() + (60 * 60 * 24 * 7); // 7 days

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

function redirect_with_error(string $message): void {
    $_SESSION["auth_error"] = $message;
    header("Location: /LocalMart/view/html/register.html");
    exit();
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: /LocalMart/view/html/register.html");
    exit();
}

$name            = trim($_POST["name"] ?? "");
$email           = trim($_POST["email"] ?? "");
$role            = trim($_POST["role"] ?? "buyer");
$password        = $_POST["password"] ?? "";
$confirmPassword = $_POST["confirmPassword"] ?? "";

if ($name === "" || strlen($name) < 2) redirect_with_error("Please enter your full name.");
if ($email === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)) redirect_with_error("Please enter a valid email.");
if ($role !== "buyer" && $role !== "seller") redirect_with_error("Invalid role selected.");
if (strlen($password) < 6) redirect_with_error("Password must be at least 6 characters.");
if ($password !== $confirmPassword) redirect_with_error("Passwords do not match.");

require_once __DIR__ . "/../model/db.php";
if (!isset($conn) || !$conn) redirect_with_error("Database connection failed.");

// Standardize to Users table (capital U)
$checkSql = "SELECT id FROM Users WHERE email = ? LIMIT 1";
$checkStmt = mysqli_prepare($conn, $checkSql);
if (!$checkStmt) redirect_with_error("Server error (check).");

mysqli_stmt_bind_param($checkStmt, "s", $email);
mysqli_stmt_execute($checkStmt);
mysqli_stmt_store_result($checkStmt);

if (mysqli_stmt_num_rows($checkStmt) > 0) {
    mysqli_stmt_close($checkStmt);
    redirect_with_error("An account with this email already exists.");
}
mysqli_stmt_close($checkStmt);

$hashed = password_hash($password, PASSWORD_DEFAULT);
if ($hashed === false) redirect_with_error("Failed to secure password.");

$insertSql = "INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)";
$insertStmt = mysqli_prepare($conn, $insertSql);
if (!$insertStmt) redirect_with_error("Server error (insert).");

mysqli_stmt_bind_param($insertStmt, "ssss", $name, $email, $hashed, $role);
$ok = mysqli_stmt_execute($insertStmt);

if (!$ok) {
    mysqli_stmt_close($insertStmt);
    redirect_with_error("Could not create account.");
}

$userId = mysqli_insert_id($conn);
mysqli_stmt_close($insertStmt);

// Session = authority
$_SESSION["user_id"] = (int)$userId;
$_SESSION["name"]    = $name;
$_SESSION["role"]    = $role;

// Cookies = convenience
set_auth_cookies($_SESSION["role"], $_SESSION["name"]);

// Redirect by role
if ($role === "seller") {
    header("Location: /LocalMart/controllers/seller_dashboard.php");
    exit();
}

header("Location: /LocalMart/controllers/buyer_dashboard.php");
exit();
