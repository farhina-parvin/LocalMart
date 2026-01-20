<?php
session_start();
require_once __DIR__ . "/../model/db.php";



if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: /LOCALMART/view/html/login.html");
    exit;
}

$email = trim($_POST["email"] ?? "");
$password = $_POST["password"] ?? "";
$role = $_POST["role"] ?? "";

if ($email === "" || $password === "" || $role === "") {
    echo "Missing fields.";
    exit;
}

$sql = "SELECT id, name, email, password, role FROM users WHERE email = ? AND role = ? LIMIT 1";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $email, $role);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows !== 1) {
    echo "User not found.";
    exit;
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user["password"])) {
    echo "Invalid password.";
    exit;
}

// Success: set session
$_SESSION["user_id"] = (int)$user["id"];
$_SESSION["name"] = $user["name"];
$_SESSION["role"] = $user["role"];

// Redirect by role
if ($user["role"] === "buyer") {
    header("Location: /LocalMart/controllers/buyer_dashboard.php");
} elseif ($user["role"] === "seller") {
    header("Location: /LocalMart/controllers/seller_dashboard.php");
} elseif ($user["role"] === "admin") {
    header("Location: /LocalMart/controllers/admin_dashboard.php");
    exit;
}  
exit;
