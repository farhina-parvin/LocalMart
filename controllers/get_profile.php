<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

if (!isset($_SESSION["user_id"])) {
  http_response_code(401);
  echo json_encode(["ok"=>false,"error"=>"Unauthorized"]);
  exit;
}

require_once "../model/db.php";
$userId = (int)$_SESSION["user_id"];

$stmt = mysqli_prepare($conn, "SELECT id, name, email, role FROM Users WHERE id=? LIMIT 1");
mysqli_stmt_bind_param($stmt, "i", $userId);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);
$row = mysqli_fetch_assoc($res);
mysqli_stmt_close($stmt);

echo json_encode(["ok"=>true,"user"=>$row]);
