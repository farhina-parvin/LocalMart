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
| 2) Must be a seller
|    If buyer, send them to buyer dashboard
|--------------------------------------------------------------------------
*/
$role = $_SESSION["role"] ?? "";

if ($role !== "seller") {
    header("Location: buyer_dashboard.php");
    exit();
}

/*
|--------------------------------------------------------------------------
| 3) Redirect seller to the real Seller UI page (new design)
|--------------------------------------------------------------------------
*/
header("Location: ../view/html/seller.html");
exit();
