<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PIG</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/WebProjectYear2UAIC/public/css/header-footer.css">
    <script src= "/WebProjectYear2UAIC/public/js/searchUser.js"></script>
    <?php if (!empty($scriptSource)) echo $scriptSource; ?>
    <?php if (!empty($additionalCss)) echo $additionalCss; ?>
</head>
<body>
<header class="site-header">
    <div class="margin">
        <a href="/WebProjectYear2UAIC/public" class="logo">Program Input Generator</a>
        <nav>
            <ul class="align">
                <?php if(isset($_COOKIE['jwt'])): ?>
                    <li>
                        <form action="/searchUser" method="POST" style="display:inline;" class="search" autocomplete="off">
                            <input type="text" name="query" placeholder="Search..." required autocomplete="off" class="queryBox">
                            <ul id="results"></ul>
                        </form>
                    </li>
                <?php endif; ?>
                <li><a href="/WebProjectYear2UAIC/public">Home</a></li>
                <?php if(isset($_COOKIE['jwt'])): ?>
                    <li><a href="/WebProjectYear2UAIC/public/profile">Profile</a></li>
                    <li><a href="/WebProjectYear2UAIC/public/logout">Logout</a></li>
                <?php else: ?>
                    <li><a href="/WebProjectYear2UAIC/public/login">Login</a></li>
                    <li><a href="/WebProjectYear2UAIC/public/register">Register</a></li>
                <?php endif; ?>
            </ul>
        </nav>
    </div>
</header>