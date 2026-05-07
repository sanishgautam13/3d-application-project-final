<?php
/* LOAD — view loader helper */

class Load
{
    // Generic helper for loading view files
    public static function view($viewName, $data = [])
    {
        $viewFile = __DIR__ . '/' . $viewName . '.php';
        if (file_exists($viewFile)) {
            // Make data variables available to the view
            extract($data);
            include $viewFile;
        } else {
            echo "View not found: $viewName";
        }
    }
}