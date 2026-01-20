<?php
session_start();

/*
|--------------------------------------------------------------------------
| 1) Must be logged in
|--------------------------------------------------------------------------
*/
if (!isset($_SESSION["user_id"])) {
    header("Location: ../view/html/login.html");
    exit();
}

/*
|--------------------------------------------------------------------------
| 2) Role guard:
|    - If buyer => continue
|    - If seller => send to seller dashboard
|--------------------------------------------------------------------------
*/
$role = $_SESSION["role"] ?? "";

if ($role !== "buyer") {
    header("Location: seller_dashboard.php");
    exit();
}

/*
|--------------------------------------------------------------------------
| 3) Redirect buyer to the real Buyer UI page (new design)
|--------------------------------------------------------------------------
*/
header("Location: ../view/html/buyer.html");
exit();
