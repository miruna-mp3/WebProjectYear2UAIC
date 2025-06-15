<?php
    define('CONT', __DIR__ . '/../controllers/');
    class App{
        public function __construct() {
            $url = $this->parseUrl();
            $method = $_SERVER['REQUEST_METHOD'];
            $resource = $url[0] ?? 'home';
            
            unset($url[0]);
            if($url)
                $args = array_values($url) ?? null;
            
            switch ($resource) {
                case 'home':
                    require_once CONT . 'HomeController.php';
                    $controller = new HomeController();

                    if($method === 'GET'){  
                        $controller->index();
                    } else if($method === 'POST') {
                        
                    }
                    break;

                case 'login':
                    require_once CONT . 'AuthController.php';
                    $controller = new AuthController();
                    if($method === 'GET'){
                        $controller->showLogin();
                    } else if($method === 'POST'){
                        $controller->login($_POST);
                    }
                    break;

                case 'register':
                    require_once CONT . 'AuthController.php';
                    $controller = new AuthController();
                    if($method === 'GET'){
                        $controller->showRegister();
                    } else if($method === 'POST'){
                        $controller->register($_POST);
                    }
                    break;

                case 'logout':
                    require_once CONT . 'AuthController.php';
                    $controller = new AuthController();
                    $controller->logout();
                    break;

                case 'profile':
                    require_once CONT . 'ProfileController.php';

                    break;

                case 'queries':
                    require_once CONT . 'QueryController.php';
                    $controller = new QueryController();

                    if ($method === 'GET') {
                        $controller->index();
                    } else if ($method === 'POST') {
                        $controller->store();
                    } else if (($method === 'PUT' || $method === 'PATCH')) {
                        $controller->update($id);
                    } else if ($method === 'DELETE') {
                        $controller->destroy($id);
                    } else {
                        // 404 or method not allowed
                    }
                    break;

                default:
                    require_once CONT . 'HomeController.php';
                    $controller = new HomeController();
                    $controller->index();
                    break;
                // Add cases for other resources
            }
        }

        public function parseUrl(){
            if(isset($_GET['url'])){
                return $url = explode('/', filter_var(rtrim($_GET['url'], '/'), FILTER_SANITIZE_URL));
            }
        }

    }
?>