<?php
//  DATABASE SETUP SCRIPT

require_once __DIR__ . '/application/model/model.php';

echo "<h1>Setting up the database...</h1>";

// Read the existing data.json file
$jsonFile = __DIR__ . '/data.json';
if (!file_exists($jsonFile)) {
    die('<p style="color:red">Error: data.json not found in project root.</p>');
}

$jsonData = json_decode(file_get_contents($jsonFile), true);
if (!$jsonData) {
    die('<p style="color:red">Error: data.json is invalid.</p>');
}

// Make sure the database folder exists
$dbDir = __DIR__ . '/database';
if (!is_dir($dbDir)) {
    mkdir($dbDir, 0755, true);
    echo "<p>Created database folder.</p>";
}

// Connect and create the table
$model = new Model();
if ($model->createTable()) {
    echo "<p>✓ Models table created (or already exists).</p>";
} else {
    die('<p style="color:red">Failed to create models table.</p>');
}

// Insert each model from the JSON
$inserted = 0;
foreach ($jsonData['models'] as $modelData) {
    if ($model->insertModel($modelData)) {
        $inserted++;
        echo "<p>✓ Inserted: <strong>" . htmlspecialchars($modelData['fullTitle']) . "</strong></p>";
    } else {
        echo "<p style='color:red'>✗ Failed to insert: " . htmlspecialchars($modelData['fullTitle']) . "</p>";
    }
}

echo "<h2>Done. Inserted $inserted models.</h2>";

// Verify by reading back from SQLite
echo "<h3>Verification — reading models back from SQLite:</h3>";
$allModels = $model->getAllModels();
echo "<pre>";
print_r($allModels);
echo "</pre>";

$model->close();

echo "<p><a href='index.php'>← Back to MVC entry point</a> | ";
echo "<a href='index.html'>Open the site →</a></p>";