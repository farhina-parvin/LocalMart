<?php
session_start();
session_unset();
session_destroy();
header("Location: /LOCALMART/view/html/login.html");
exit;
