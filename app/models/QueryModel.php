<?php
require_once __DIR__ . '/../database/db_connection.php';

class QueryModel {
    public function saveQuery($userId, $jsonData) {
        $db = Database::getDbInstance()->getConnection();
        $query = "INSERT INTO queries (user_id, json_data, created_at) VALUES ($1, $2, NOW())";
        $result = pg_query_params($db, $query, [$userId, $jsonData]);
        return $result !== false;
    }
}