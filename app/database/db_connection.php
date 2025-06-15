<?php

class Database {
    private static $database = null;
    private $conn;

    private function __construct(){
        $env = parse_ini_file(__DIR__ . '/../../misc/.env');
        $db_user = $env['USER'];
        $db_password = $env['PASSWORD'];
        $db_name = $env['NAME'];
        $db_host = $env['HOST'];
        $this->conn = pg_connect("host=$db_host dbname=$db_name user=$db_user password=$db_password");

        if(!$this->conn){
            $e = pg_last_error($conn);
            die("Connection failed: " . $e);
        }
    }

    public static function getDatabase(){
        if(!self::$database){
            self::$database = new Database();
        }
        return self::$database;
    }

    public function getConnection(){
        return $this->conn;
    }
}

?>