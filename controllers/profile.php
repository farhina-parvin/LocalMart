<?php
session_start();
if (!isset($_SESSION["user_id"])) {
  header("Location: /LocalMart/view/html/login.html");
  exit;
}
header("Location: /LocalMart/view/html/profile.html");
exit;
