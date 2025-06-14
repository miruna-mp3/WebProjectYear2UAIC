<?php
    include "decodeUserId.php";

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Make sure $userId is set and sanitized!
        $sqlQuery = "SELECT query_count FROM user_query_stats WHERE id = $1";
        $result = pg_query_params($conn, $sqlQuery, array($userId));
        if ($result) {
            $row = pg_fetch_assoc($result);
            if ($row) {
                echo json_encode($row['query_count']);
            } else {
                http_response_code(404);
                echo json_encode([
                    "success" => false,
                    "message" => "No user found."
                ]);
            }
        } else {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Database error: " . pg_last_error($conn)
            ]);
        }
        exit;
    }

    header('Content-Type: application/json');


    $sqlQuery = "SELECT id, name FROM queries WHERE \"ownerId\" = $1";
    $result = pg_query_params($conn, $sqlQuery, array($userId));

    if(!$result){
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Queries not found"
        ]);
        exit;
    }
    
    $queries = [];
    while($row = pg_fetch_assoc($result)){
        $queries[] = [
            'id' => $row['id'],
            'name' => $row['name']
        ];
    }

    // if(sizeof($queries) === 0)
    //     echo json_encode('');
    echo json_encode($queries);
?>