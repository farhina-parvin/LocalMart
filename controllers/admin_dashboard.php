<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();

if (!isset($_SESSION["user_id"]) || (($_SESSION["role"] ?? "") !== "admin")) {
  header("Location: /LocalMart/view/html/login.html");
  exit;
}

// If admin is logged in, send to admin UI page
header("Location: /LocalMart/view/html/admin.html");
exit;


$name = htmlspecialchars($_SESSION["name"] ?? "Admin");
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin Dashboard</title>
  <link rel="stylesheet" href="/LocalMart/view/css/admin.css?v=1">
</head>
<body>
  <header class="topbar">
    <div class="brand">
      <div class="brandMark">LM</div>
      <div>
        <div class="brandName">LocalMart Admin</div>
        <div class="brandSub">Welcome, <?= $name ?></div>
      </div>
    </div>

    <nav class="nav">
      <a class="navLink" href="/LocalMart/view/html/welcome.html">Home</a>
      <a class="navLink navLink--muted" href="/LocalMart/controllers/logout.php">Logout</a>
    </nav>
  </header>

  <main class="wrap">
    <!-- We render everything via admin.html structure -->
    <?php include __DIR__ . "/../view/html/admin.html"; ?>
  </main>

  <script src="/LocalMart/view/js/admin.js?v=1"></script>
</body>
</html>
