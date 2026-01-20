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
$userId = (int)($data["user_id"] ?? 0);

if ($userId <= 0) {
  http_response_code(400);
  echo json_encode(["ok"=>false,"error"=>"Invalid user_id."]);
  exit;
}

// Prevent deleting admins (including yourself)
$stmt = mysqli_prepare($conn, "SELECT role FROM Users WHERE id = ?");
mysqli_stmt_bind_param($stmt, "i", $userId);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);
$row = mysqli_fetch_assoc($res);
mysqli_stmt_close($stmt);

if (!$row) {
  http_response_code(404);
  echo json_encode(["ok"=>false,"error"=>"User not found."]);
  exit;
}
if ($row["role"] === "admin") {
  http_response_code(403);
  echo json_encode(["ok"=>false,"error"=>"Admins cannot be removed."]);
  exit;
}

// Transaction: delete their listings first, then delete user
mysqli_begin_transaction($conn);
try {
  $stmt1 = mysqli_prepare($conn, "DELETE FROM products WHERE seller_id = ?");
  mysqli_stmt_bind_param($stmt1, "i", $userId);
  mysqli_stmt_execute($stmt1);
  mysqli_stmt_close($stmt1);

  $stmt2 = mysqli_prepare($conn, "DELETE FROM Users WHERE id = ?");
  mysqli_stmt_bind_param($stmt2, "i", $userId);
  mysqli_stmt_execute($stmt2);
  $affected = mysqli_stmt_affected_rows($stmt2);
  mysqli_stmt_close($stmt2);

  if ($affected <= 0) throw new Exception("Delete failed.");

  mysqli_commit($conn);
  echo json_encode(["ok"=>true]);
} catch (Throwable $e) {
  mysqli_rollback($conn);
  http_response_code(500);
  echo json_encode(["ok"=>false,"error"=>$e->getMessage()]);
}
