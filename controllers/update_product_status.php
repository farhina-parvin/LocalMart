<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

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

$data = json_decode(file_get_contents("php://input"), true);
$productId = (int)($data["product_id"] ?? 0);
$status    = trim($data["status"] ?? "");
$sellerId  = (int)$_SESSION["user_id"];

$allowed = ["active","sold","draft"];
if ($productId <= 0 || !in_array($status, $allowed, true)) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Invalid product_id or status."]);
  exit();
}

$stmt = mysqli_prepare($conn, "UPDATE products SET status = ? WHERE id = ? AND seller_id = ?");
mysqli_stmt_bind_param($stmt, "sii", $status, $productId, $sellerId);
mysqli_stmt_execute($stmt);
$affected = mysqli_stmt_affected_rows($stmt);
mysqli_stmt_close($stmt);

if ($affected <= 0) {
  http_response_code(404);
  echo json_encode(["ok" => false, "error" => "Product not found or not yours."]);
  exit();
}

echo json_encode(["ok" => true]);
