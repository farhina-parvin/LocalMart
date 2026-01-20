<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

if (!isset($_SESSION["user_id"]) || (($_SESSION["role"] ?? "") !== "seller")) {
  http_response_code(401);
  echo json_encode(["ok" => false, "error" => "Unauthorized (seller only)."]);
  exit();
}

require_once "../model/db.php";
$sellerId = (int)$_SESSION["user_id"];

$sql = "SELECT id, title, price, quantity, category, `condition`, description, location, photo_url, status, created_at
        FROM products
        WHERE seller_id = ?
        ORDER BY created_at DESC";

$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, "i", $sellerId);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);

$products = [];
while ($row = mysqli_fetch_assoc($res)) {
  $products[] = [
    "id" => (int)$row["id"],
    "title" => $row["title"],
    "price" => (float)$row["price"],
    "quantity" => (int)$row["quantity"],
    "category" => $row["category"],
    "condition" => $row["condition"],
    "desc" => $row["description"],
    "location" => $row["location"],
    "photo" => $row["photo_url"],
    "status" => $row["status"],
    "createdAt" => strtotime($row["created_at"]) * 1000
  ];
}

mysqli_stmt_close($stmt);

echo json_encode(["ok" => true, "products" => $products]);
