<?php
    class UserModel{
        public function loginUser($data){
            require_once __DIR__ . '/../database/db_connection.php';
            $db = Database::getDatabase();
            $conn = $db->getConnection();

            $username = htmlspecialchars(trim($data['username'] ?? ''));
            $password = htmlspecialchars(trim($data['password'] ?? ''));

            if (!$username || !$password) {
                return [
                    'success' => false,
                    'message' => 'Please fill in all fields.'
                ];
            }

            $query = "SELECT * FROM users WHERE username = $1";
            $result = pg_query_params($conn, $query, [$username]);

            if ($result && pg_num_rows($result) === 1) {
                $row = pg_fetch_assoc($result);
                pg_free_result($result);

                if (password_verify($password, $row['password'])) {
                    // return user data for token creation
                    return [
                        'success' => true,
                        'message' => 'Signed in successfully.',
                        'user' => $row
                    ];
                } else {
                    return [
                        'success' => false,
                        'message' => 'Invalid username or password.'
                    ];
                }
            } else {
                return [
                    'success' => false,
                    'message' => 'Invalid username or password.'
                ];
            }
        }
        public function registerUser($data){
            include __DIR__ . '/../database/db_connection.php';
            $db = Database::getDatabase();
            $conn = $db->getConnection();

            $username = htmlspecialchars(trim($data['username'] ?? ''));
            $email = htmlspecialchars(trim($data['email'] ?? ''));
            $password = htmlspecialchars(trim($data['password'] ?? ''));

            if (!$username || !$email || !$password) {
                return [ 'success' => false, 'message' => 'Please fill in all fields.' ];
            }

            $checkEmailQuery = "SELECT email FROM users WHERE email = $1";
            $checkEmailResult = pg_query_params($conn, $checkEmailQuery, [$email]);
            $checkUsernameQuery = "SELECT username FROM users WHERE username = $1";
            $checkUsernameResult = pg_query_params($conn, $checkUsernameQuery, [$username]);

            if($checkEmailResult === false || $checkUsernameResult === false){
                return [ 'success' => false, 'message' => 'Database error: ' . pg_last_error($conn) ];
            }

            if (pg_num_rows($checkUsernameResult) > 0) {
                return [ 'success' => false, 'message' => 'Username already exists.' ];
            } else if (pg_num_rows($checkEmailResult) > 0) {
                return [ 'success' => false, 'message' => 'Email already exists.' ];
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)){
                return [ 'success' => false, 'message' => 'Email isn\'t valid.' ];
            }

            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
            $insertQuery = "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)";
            $result = pg_query_params($conn, $insertQuery, [$username, $email, $hashedPassword]);

            if ($result) {
                pg_free_result($result);
                return [ 'success' => true, 'message' => 'Account created successfully.' ];
            } else {
                return [ 'success' => false, 'message' => 'Database error: ' . pg_last_error($conn) ];
            }
        }
    }
    
?>