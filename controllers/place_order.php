<?php
// controllers/place_order.php
session_start();
header("Content-Type: application/json; charset=UTF-8");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

function set_last_payment_method_cookie(string $method): void {
  $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
  $expires = time() + (60 * 60 * 24 * 30); // 30 days

  setcookie("lm_last_pay_method", $method, [
      "expires"  => $expires,
      "path"     => "/",
      "secure"   => $secure,
      "httponly" => true,
      "samesite" => "Lax",
  ]);
}

if (!isset($_SESSION["user_id"]) || (($_SESSION["role"] ?? "") !== "buyer")) {
  http_response_code(401);
  echo json_encode(["ok" => false, "error" => "Unauthorized (buyer only)."]);
  exit();
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo json_encode(["ok" => false, "error" => "Method not allowed. Use POST."]);
  exit();
}

require_once __DIR__ . "/../model/db.php";
if (!isset($conn) || !$conn) {
  http_response_code(500);
  echo json_encode(["ok" => false, "error" => "DB connection failed."]);
  exit();
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!$data) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Invalid JSON payload."]);
  exit();
}

// validate auth code: 6 digits
$auth = trim($data["authorization_code"] ?? "");
if (!preg_match('/^\d{6}$/', $auth)) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Authorization code must be exactly 6 digits."]);
  exit();
}

$id = (int)$_SESSION["user_id"];

// pull email from DB (Users table)
$stmt = mysqli_prepare($conn, "SELECT email FROM Users WHERE id = ?");
if (!$stmt) {
  http_response_code(500);
  echo json_encode(["ok" => false, "error" => "Prepare failed: " . mysqli_error($conn)]);
  exit();
}
mysqli_stmt_bind_param($stmt, "i", $id);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);
$row = mysqli_fetch_assoc($res);
mysqli_stmt_close($stmt);

if (!$row || empty($row["email"])) {
  http_response_code(500);
  echo json_encode(["ok" => false, "error" => "Could not find buyer email in database."]);
  exit();
}
$email = $row["email"];

// create tables if not exists (demo)
mysqli_query($conn, "
  CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,
    address_json TEXT NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_ref VARCHAR(60) NOT NULL,
    authorization_code VARCHAR(6) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    fee DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
");

mysqli_query($conn, "
  CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    qty INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
");

$address = $data["address"] ?? [];
$payment = $data["payment"] ?? [];
$cart    = $data["cart"] ?? [];
$totals  = $data["totals"] ?? [];

if (!is_array($cart) || count($cart) === 0) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Cart is empty."]);
  exit();
}

$addressJson = json_encode($address, JSON_UNESCAPED_UNICODE);

$method = trim($payment["method"] ?? "unknown");
$ref    = trim($payment["ref"] ?? "unknown");

// ✅ Store only the method (not phone/ref/pin) as a cookie
set_last_payment_method_cookie($method);

$subtotal = (float)($totals["sub"] ?? 0);
$fee      = (float)($totals["fee"] ?? 0);
$total    = (float)($totals["total"] ?? 0);

// ---------- TRANSACTION: stock decrement + order insert ----------
mysqli_begin_transaction($conn);

try {
  // 1) Validate and decrement stock (row-level lock)
  $lockStmt = mysqli_prepare($conn, "SELECT quantity, status FROM products WHERE id = ? FOR UPDATE");
  if (!$lockStmt) throw new Exception("Prepare failed (lock): " . mysqli_error($conn));

  $decStmt = mysqli_prepare($conn, "UPDATE products SET quantity = quantity - ? WHERE id = ? AND quantity >= ?");
  if (!$decStmt) throw new Exception("Prepare failed (decrement): " . mysqli_error($conn));

  foreach ($cart as $it) {
    $pid = (int)($it["id"] ?? 0);
    $qty = (int)($it["qty"] ?? 1);

    if ($pid <= 0 || $qty <= 0) {
      throw new Exception("Invalid cart item.");
    }

    mysqli_stmt_bind_param($lockStmt, "i", $pid);
    mysqli_stmt_execute($lockStmt);
    $r = mysqli_stmt_get_result($lockStmt);
    $pRow = mysqli_fetch_assoc($r);

    if (!$pRow) throw new Exception("Product not found (ID: $pid).");
    if (($pRow["status"] ?? "") !== "active") throw new Exception("Product not available (ID: $pid).");

    $available = (int)$pRow["quantity"];
    if ($available < $qty) {
      throw new Exception("Not enough stock for product ID $pid. Available: $available, requested: $qty.");
    }

    mysqli_stmt_bind_param($decStmt, "iii", $qty, $pid, $qty);
    mysqli_stmt_execute($decStmt);

    if (mysqli_stmt_affected_rows($decStmt) <= 0) {
      throw new Exception("Stock update failed for product ID $pid.");
    }
  }

  mysqli_stmt_close($lockStmt);
  mysqli_stmt_close($decStmt);

  // 2) Insert order
  $orderStmt = mysqli_prepare($conn, "
    INSERT INTO orders (buyer_id, buyer_email, address_json, payment_method, payment_ref, authorization_code, subtotal, fee, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ");
  if (!$orderStmt) throw new Exception("Prepare failed (order): " . mysqli_error($conn));

  mysqli_stmt_bind_param($orderStmt, "isssssddd", $id, $email, $addressJson, $method, $ref, $auth, $subtotal, $fee, $total);

  if (!mysqli_stmt_execute($orderStmt)) {
    throw new Exception("Execute failed (order): " . mysqli_stmt_error($orderStmt));
  }

  $orderId = mysqli_insert_id($conn);
  mysqli_stmt_close($orderStmt);

  // 3) Insert order items
  $itemStmt = mysqli_prepare($conn, "
    INSERT INTO order_items (order_id, product_id, title, price, qty)
    VALUES (?, ?, ?, ?, ?)
  ");
  if (!$itemStmt) throw new Exception("Prepare failed (items): " . mysqli_error($conn));

  foreach ($cart as $it) {
    $pid   = (int)($it["id"] ?? 0);
    $title = (string)($it["title"] ?? "Item");
    $price = (float)($it["price"] ?? 0);
    $qty   = (int)($it["qty"] ?? 1);

    mysqli_stmt_bind_param($itemStmt, "iisdi", $orderId, $pid, $title, $price, $qty);
    mysqli_stmt_execute($itemStmt);
  }
  mysqli_stmt_close($itemStmt);

  // 4) Optional: mark sold when quantity hits 0
  mysqli_query($conn, "UPDATE products SET status='sold' WHERE quantity <= 0");

  mysqli_commit($conn);

  echo json_encode([
    "ok" => true,
    "order_id" => $orderId,
    "email" => $email
  ]);
} catch (Exception $e) {
  mysqli_rollback($conn);
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => $e->getMessage()]);
}
