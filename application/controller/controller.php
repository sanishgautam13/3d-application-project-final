<?php
/* CONTROLLER — handles requests, calls the model, returns data */

class Controller
{
    private $model;

    public function __construct()
    {
        $this->model = new Model();
    }

    // Get all models — used by the API endpoint
    public function getAllModels()
    {
        return $this->model->getAllModels();
    }

    // Get a specific model by its page filename
    public function getModelByPage($page)
    {
        return $this->model->getModelByPage($page);
    }

    // Return the site name (kept for parity with the JSON-based loader)
    public function getSiteName()
    {
        return 'The Assignment Survival Kit';
    }
}