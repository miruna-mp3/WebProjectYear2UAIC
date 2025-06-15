<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <script src="../public/js/login.js" defer></script>
    <link rel="stylesheet" href="../public/css/styles.css"></link>
</head>



<body class="flexbody">
    <div class="form">
        <form id="loginForm" action="login" method="post" class="form-login">
            <h1>Sign In</h1>
            <div class="justify">
                <label for="username">Username</label>
                <input type="text" name="username" id="username" placeholder="Enter username" required maxlength="30">
            </div>
            <div class="justify">
                <label for="password">Password</label>
                <input type="password" name="password" id="password" placeholder="Enter password" required maxlength="40"> 
            </div>
            <button type="submit">Login</button>
            <div id="message"></div>
            <!-- <footer>Forgot password?<a href="login.html">Login here</a></footer> -->
        </form>
    </div>
</body>

</html>