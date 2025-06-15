<?php
    class Controller{

        public function model($model){
            require_once '../app/models/' . $model . '.php';
            return new $model();
        }

        public function view($view, $data = []){
            require_once '../app/views/' . $view . '.php';
        }

        // Nu stiu daca implementam posibilitatea de apelare API
        // public function json($data, $status = 200) {
        //     http_response_code($status);
        //     header('Content-Type: application/json');
        //     echo json_encode($data);
        //     exit;
        // }
    }
?>