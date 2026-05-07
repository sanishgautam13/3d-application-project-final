<?php
/* MVC ENTRY POINT */

require_once __DIR__ . '/application/model/model.php';
require_once __DIR__ . '/application/view/load.php';
require_once __DIR__ . '/application/controller/controller.php';

// Instantiate the controller 
$controller = new Controller();

// Default landing message if accessed directly in a browser
if (php_sapi_name() !== 'cli' && empty($_SERVER['QUERY_STRING'])) {
    echo "<h1>The Assignment Survival Kit — MVC Backend</h1>";
    echo "<p>The MVC framework is running.</p>";
    echo "<ul>";
    echo "<li><a href='setup_database.php'>Set up the database</a> (run this first)</li>";
    echo "<li><a href='api/get_models.php'>API: get all models</a></li>";
    echo "<li><a href='api/get_models.php?page=redbull.html'>API: get one model</a></li>";
    echo "<li><a href='index.html'>Open the site</a></li>";
    echo "</ul>";
}