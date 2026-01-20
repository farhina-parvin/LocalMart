<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

function fail($msg, $code=400) {
  http_response_code($code);
  echo json_encode(["ok"=>false, "error"=>$msg]);
  exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  fail("Method not allowed. Use POST.", 405);
}

require_once "../model/db.php";
if (!isset($conn) || !$conn) {
  fail("Database connection failed.", 500);
}

$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data["email"] ?? "");
$newPass = $data["new_password"] ?? "";

if ($email === "" || $newPass === "") {
  fail("Email and new password are required.");
}

if (strlen($newPass) < 6) {
  fail("Password must be at least 6 characters.");
}

// Check user exists
$stmt = mysqli_prepare($conn, "SELECT id FROM Users WHERE email = ? LIMIT 1");
mysqli_stmt_bind_param($stmt, "s", $email);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);
$row = mysqli_fetch_assoc($res);
mysqli_stmt_close($stmt);

if (!$row) {
  fail("No account found with that email.", 404);
}

$userId = (int)$row["id"];
$hash = password_hash($newPass, PASSWORD_DEFAULT);

// Update password
$stmt = mysqli_prepare($conn, "UPDATE Users SET password = ? WHERE id = ?");
mysqli_stmt_bind_param($stmt, "si", $hash, $userId);
mysqli_stmt_execute($stmt);
mysqli_stmt_close($stmt);

echo json_encode(["ok"=>true]);
