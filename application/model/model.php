<?php
/* MODEL — handles all SQLite database operations Uses PDO */

class Model
{
    private $db;
    private $dbPath;

    public function __construct()
    {
        // Path to the SQLite database file
        $this->dbPath = __DIR__ . '/../../database/models.db';

        try {
            // Connect to SQLite using PDO 
            $this->db = new PDO('sqlite:' . $this->dbPath);
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            die('Database connection failed: ' . $e->getMessage());
        }
    }

    // Create the models table if it does not already exist
    public function createTable()
    {
        $sql = "CREATE TABLE IF NOT EXISTS models (
            id TEXT PRIMARY KEY,
            shortTitle TEXT NOT NULL,
            fullTitle TEXT NOT NULL,
            shortDescription TEXT,
            longDescription TEXT,
            technicalNote TEXT,
            modelFile TEXT,
            page TEXT,
            icon TEXT,
            thumbnail TEXT
        )";

        try {
            $this->db->exec($sql);
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }

    // Insert a single model record
    public function insertModel($model)
    {
        $sql = "INSERT OR REPLACE INTO models
                (id, shortTitle, fullTitle, shortDescription, longDescription,
                 technicalNote, modelFile, page, icon, thumbnail)
                VALUES (:id, :shortTitle, :fullTitle, :shortDescription, :longDescription,
                        :technicalNote, :modelFile, :page, :icon, :thumbnail)";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':id'               => $model['id'],
                ':shortTitle'       => $model['shortTitle'],
                ':fullTitle'        => $model['fullTitle'],
                ':shortDescription' => $model['shortDescription'],
                ':longDescription'  => $model['longDescription'],
                ':technicalNote'    => $model['technicalNote'],
                ':modelFile'        => $model['modelFile'],
                ':page'             => $model['page'],
                ':icon'             => $model['icon'],
                ':thumbnail'        => $model['thumbnail']
            ]);
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }

    // Retrieve all models from the database
    public function getAllModels()
    {
        $sql = "SELECT * FROM models";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }

    // Retrieve a single model by its page filename
    public function getModelByPage($page)
    {
        $sql = "SELECT * FROM models WHERE page = :page";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':page' => $page]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return null;
        }
    }

    // Close the database connection
    public function close()
    {
        $this->db = null;
    }
}