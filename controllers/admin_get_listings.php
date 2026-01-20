<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

if (!isset($_SESSION["user_id"]) || (($_SESSION["role"] ?? "") !== "admin")) {
  http_response_code(401);
  echo json_encode(["ok"=>false,"error"=>"Unauthorized (admin only)."]);
  exit;
}

require_once "../model/db.php";

$sql = "
SELECT p.id, p.title, p.price, p.quantity, p.category, p.status, p.created_at,
       u.email AS seller_email
FROM products p
LEFT JOIN Users u ON u.id = p.seller_id
ORDER BY p.id DESC
";

$res = mysqli_query($conn, $sql);
$listings = [];
while ($row = mysqli_fetch_assoc($res)) {
  $listings[] = [
    "id" => (int)$row["id"],
    "title" => $row["title"],
    "price" => (float)$row["price"],
    "quantity" => (int)$row["quantity"],
    "category" => $row["category"],
    "status" => $row["status"],
    "seller_email" => $row["seller_email"] ?? ""
  ];
}
echo json_encode(["ok"=>true,"listings"=>$listings]);
