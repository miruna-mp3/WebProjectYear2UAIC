<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register</title>
    <script src="../public/js/register.js" defer></script>
    <link rel="stylesheet" href="../public/css/styles.css"></link>
</head>

<body class="flexbody">
    <div class="form">
        <form id="registerForm" action="register" method="post" class="form-registration">
            <h1>Sign Up</h1>
            <div class="justify">
                <label for="username">Username</label>
                <input type="text" name="username" id="username" placeholder="Enter username" required maxlength="30">
            </div>
            <div class="justify">
                <label for="email">Email</label>
                <input type="email" name="email" id="email" placeholder="Enter email" required maxlength="40">
            </div>
            <div class="justify">
                <label for="password">Password</label>
                <input type="password" name="password" id="password" placeholder="Enter password" required maxlength="40"> 
            </div>
            <div class="justify">
                <label for="password2">Repeat Password</label>
                <input type="password" name="password2" id="password2" placeholder="Enter password again" required>
            </div>
            <button type="submit">Register</button>
            <div id="message"></div>
            <footer>Already a member? <a href="login">Login here</a></footer>
        </form>
    </div>
</body>

</html>