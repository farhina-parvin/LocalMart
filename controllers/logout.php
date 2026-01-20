<?php
session_start();
$timeout = 5;
session_unset();
session_destroy();
header("Location: /LOCALMART/view/html/login.html");
exit;
