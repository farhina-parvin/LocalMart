<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if (!isset($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode(["ok" => false, "error" => "Not logged in."]);
    exit();
}
if (($_SESSION["role"] ?? "") !== "seller") {
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

$title       = trim(($data["title"] ?? $_POST["title"] ?? ""));
$price       = ($data["price"] ?? $_POST["price"] ?? "");
$quantity    = ($data["quantity"] ?? $_POST["quantity"] ?? 1);
$category    = trim(($data["category"] ?? $_POST["category"] ?? ""));
$condition   = trim(($data["condition"] ?? $_POST["condition"] ?? ""));
$description = trim(($data["description"] ?? $_POST["description"] ?? ""));
$location    = trim(($data["location"] ?? $_POST["location"] ?? ""));
$photo_url   = trim(($data["photo_url"] ?? $_POST["photo_url"] ?? ""));

$seller_id = intval($_SESSION["user_id"]);
if ($photo_url === "") $photo_url = null;

if (strlen($title) < 3) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Title too short."]);
    exit();
}
if (!is_numeric($price) || floatval($price) <= 0) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Invalid price."]);
    exit();
}
if (!is_numeric($quantity) || intval($quantity) < 1) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Quantity must be at least 1."]);
    exit();
}
if ($category === "" || $condition === "" || strlen($description) < 10 || strlen($location) < 2) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Missing required fields."]);
    exit();
}

$price = floatval($price);
$quantity = intval($quantity);

$sql = "INSERT INTO products
  (seller_id, title, price, quantity, category, `condition`, description, location, photo_url, status)
VALUES
  (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')";

$stmt = mysqli_prepare($conn, $sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Prepare failed: " . mysqli_error($conn)]);
    exit();
}

mysqli_stmt_bind_param(
    $stmt,
    "isdisssss",   // ✅ FIXED (9 params)
    $seller_id,
    $title,
    $price,
    $quantity,
    $category,
    $condition,
    $description,
    $location,
    $photo_url
);

if (!mysqli_stmt_execute($stmt)) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Execute failed: " . mysqli_stmt_error($stmt)]);
    mysqli_stmt_close($stmt);
    exit();
}

$newId = mysqli_insert_id($conn);
mysqli_stmt_close($stmt);

echo json_encode([
    "ok" => true,
    "product" => [
        "id" => $newId,
        "title" => $title,
        "price" => $price,
        "quantity" => $quantity,
        "category" => $category,
        "condition" => $condition,
        "description" => $description,
        "location" => $location,
        "photo_url" => $photo_url,
        "status" => "active"
    ]
]);
