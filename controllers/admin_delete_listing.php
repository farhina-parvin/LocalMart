<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

if (!isset($_SESSION["user_id"]) || (($_SESSION["role"] ?? "") !== "admin")) {
  http_response_code(401);
  echo json_encode(["ok"=>false,"error"=>"Unauthorized (admin only)."]);
  exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo json_encode(["ok"=>false,"error"=>"Use POST."]);
  exit;
}

require_once "../model/db.php";
$data = json_decode(file_get_contents("php://input"), true);
$productId = (int)($data["product_id"] ?? 0);

if ($productId <= 0) {
  http_response_code(400);
  echo json_encode(["ok"=>false,"error"=>"Invalid product_id."]);
  exit;
}

$stmt = mysqli_prepare($conn, "DELETE FROM products WHERE id = ?");
mysqli_stmt_bind_param($stmt, "i", $productId);
mysqli_stmt_execute($stmt);
$affected = mysqli_stmt_affected_rows($stmt);
mysqli_stmt_close($stmt);

if ($affected <= 0) {
  http_response_code(404);
  echo json_encode(["ok"=>false,"error"=>"Listing not found."]);
  exit;
}

echo json_encode(["ok"=>true]);
