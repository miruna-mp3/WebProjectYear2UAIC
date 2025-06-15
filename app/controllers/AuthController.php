<?php
require_once __DIR__ . '/../util/vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthController extends Controller{
    public function showLogin(){
        $this->view('login');
    }
    public function login($data){
        if(isset($_COOKIE['jwt'])) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Already logged in.'
            ]);
            return;
        }

        require_once __DIR__ . '/../models/UserModel.php';
        $env = parse_ini_file(__DIR__ . '/../../misc/.env');
        $model = new UserModel();
        $result = $model->loginUser($data);

        header('Content-Type: application/json');

        if ($result['success']) {
            $key = $env['JWTSECRET'];
            $iss_time = time();
            $payload = [
                "iss" => "http://www.ProgramInputGenerator.com",
                "iat" => $iss_time,
                "exp" => $iss_time + 3600 * 24 * 7,
                "user_id" => $result['user']['id']
            ];
            $jwt = JWT::encode($payload, $key, 'HS256');
            setcookie("jwt", $jwt, [
                "expires" => time() + 3600,
                "httponly" => true,
                "samesite" => "Lax",
                "path" => "/"
            ]);
            unset($result['user']);
        } else {
            http_response_code(401);
        }
        echo json_encode($result);
    }

    public function showRegister(){
        $this->view('register');
    }
    public function register($data){
        if(isset($_COOKIE['jwt'])) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Already logged in.'
            ]);
            return;
        }

        require_once __DIR__ . '/../models/UserModel.php';
        $model = new UserModel();

        $result = $model->registerUser($data);

        header('Content-Type: application/json');
        echo json_encode($result);
    }

    public function logout(){
        setcookie('jwt', '', -1, '/');
        header('Location: home');
    }
}
?>