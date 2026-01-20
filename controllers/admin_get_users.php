<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

if (!isset($_SESSION["user_id"]) || (($_SESSION["role"] ?? "") !== "admin")) {
  http_response_code(401);
  echo json_encode(["ok"=>false,"error"=>"Unauthorized (admin only)."]);
  exit;
}

require_once "../model/db.php";

$res = mysqli_query($conn, "SELECT id, name, email, role, created_at FROM Users ORDER BY id DESC");
$users = [];
while ($row = mysqli_fetch_assoc($res)) {
  $users[] = [
    "id" => (int)$row["id"],
    "name" => $row["name"],
    "email" => $row["email"],
    "role" => $row["role"]
  ];
}
echo json_encode(["ok"=>true,"users"=>$users]);
