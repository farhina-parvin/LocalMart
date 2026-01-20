<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

if (!isset($_SESSION["user_id"])) {
  http_response_code(401);
  echo json_encode(["ok"=>false,"error"=>"Unauthorized"]);
  exit;
}
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo json_encode(["ok"=>false,"error"=>"Use POST"]);
  exit;
}

require_once "../model/db.php";
$data = json_decode(file_get_contents("php://input"), true);

$name = trim($data["name"] ?? "");
$newPass = $data["new_password"] ?? "";
$userId = (int)$_SESSION["user_id"];

if (strlen($name) < 2) {
  http_response_code(400);
  echo json_encode(["ok"=>false,"error"=>"Name must be at least 2 characters"]);
  exit;
}

if ($newPass !== "") {
  if (strlen($newPass) < 6) {
    http_response_code(400);
    echo json_encode(["ok"=>false,"error"=>"Password must be at least 6 characters"]);
    exit;
  }
  $hash = password_hash($newPass, PASSWORD_DEFAULT);
  $stmt = mysqli_prepare($conn, "UPDATE Users SET name=?, password=? WHERE id=?");
  mysqli_stmt_bind_param($stmt, "ssi", $name, $hash, $userId);
} else {
  $stmt = mysqli_prepare($conn, "UPDATE Users SET name=? WHERE id=?");
  mysqli_stmt_bind_param($stmt, "si", $name, $userId);
}

mysqli_stmt_execute($stmt);
mysqli_stmt_close($stmt);

$_SESSION["name"] = $name;
echo json_encode(["ok"=>true]);
