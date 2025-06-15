<?php
require_once __DIR__ . '/../models/QueryModel.php';

class QueryController {
    public function save() {
        $jsonData = $_POST['jsonData'] ?? '';
        $userId = $_COOKIE['jwt'] ?? null; // Use your JWT decoding here

        $model = new QueryModel();
        $success = $model->saveQuery($userId, $jsonData);

        header('Content-Type: application/json');
        if ($success) {
            echo json_encode(['success' => true, 'message' => 'Query saved successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to save query.']);
        }
    }
}