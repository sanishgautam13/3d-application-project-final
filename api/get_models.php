<?php
/* API ENDPOINT — get_models.php
   This is what the AJAX call from data_loader.js hits.*/

// Set the correct response headers for JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Load all three MVC layers
require_once __DIR__ . '/../application/model/model.php';
require_once __DIR__ . '/../application/controller/controller.php';

// Instantiate the controller
$controller = new Controller();

// If a specific page was requested, return just that one model
if (isset($_GET['page']) && !empty($_GET['page'])) {
    $page = $_GET['page'];
    $modelData = $controller->getModelByPage($page);

    if ($modelData) {
        echo json_encode([
            'success' => true,
            'siteName' => $controller->getSiteName(),
            'model' => $modelData
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Model not found for page: ' . $page
        ]);
    }
    exit;
}

// Otherwise return all models (matches data.json structure exactly)
$allModels = $controller->getAllModels();

echo json_encode([
    'siteName' => $controller->getSiteName(),
    'tagline' => 'The Assignment Edition',
    'siteDescription' => 'These are the three things that get me through every deadline — energy, a quiet space, and the laptop that does all the work.',
    'models' => $allModels
]);