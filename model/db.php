<?php
$host = "127.0.0.1";
$user = "root";
$pass = "";
$db   = "localmart";
$port = 3307;

$conn = new mysqli($host, $user, $pass, $db, $port);

if ($conn->connect_error) {
    die("DB connection failed: " . $conn->connect_error);
}
$conn->set_charset("utf8mb4");
