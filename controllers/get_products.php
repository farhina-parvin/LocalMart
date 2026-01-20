<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

require_once "../model/db.php";
if (!isset($conn) || !$conn) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "DB connection failed"]);
    exit();
}

if (!isset($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["ok" => false, "error" => "Unauthorized"]);
    exit();
}

$sql = "SELECT id, seller_id, title, price, quantity, category, `condition`,
               description, location, photo_url, status, created_at
        FROM products
        WHERE status = 'active' AND quantity > 0
        ORDER BY created_at DESC
        LIMIT 200";

$res = mysqli_query($conn, $sql);
if (!$res) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Query failed: " . mysqli_error($conn)]);
    exit();
}

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
        "createdAt" => strtotime($row["created_at"]) * 1000
    ];
}

echo json_encode(["ok" => true, "products" => $products]);
