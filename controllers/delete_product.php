<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if (!isset($_SESSION["user_id"]) || (($_SESSION["role"] ?? "") !== "seller")) {
  http_response_code(401);
  echo json_encode(["ok" => false, "error" => "Unauthorized (seller only)."]);
  exit();
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo json_encode(["ok" => false, "error" => "Method not allowed. Use POST."]);
  exit();
}

require_once "../model/db.php";
if (!isset($conn) || !$conn) {
  http_response_code(500);
  echo json_encode(["ok" => false, "error" => "DB connection failed."]);
  exit();
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

$productId = (int)($data["product_id"] ?? 0);
$sellerId  = (int)($_SESSION["user_id"]);

if ($productId <= 0) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Invalid product_id."]);
  exit();
}

// Only allow deleting your own product
$stmt = mysqli_prepare($conn, "DELETE FROM products WHERE id = ? AND seller_id = ?");
if (!$stmt) {
  http_response_code(500);
  echo json_encode(["ok" => false, "error" => "Prepare failed: " . mysqli_error($conn)]);
  exit();
}

mysqli_stmt_bind_param($stmt, "ii", $productId, $sellerId);
mysqli_stmt_execute($stmt);
$affected = mysqli_stmt_affected_rows($stmt);
mysqli_stmt_close($stmt);

if ($affected <= 0) {
  http_response_code(404);
  echo json_encode(["ok" => false, "error" => "Product not found or not yours."]);
  exit();
}

echo json_encode(["ok" => true]);
