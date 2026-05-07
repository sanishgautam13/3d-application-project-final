// data_loader.js
//Loads the model data and puts it on the page.
//First tries the PHP/SQLite endpoint, falls back to data.json if PHP isn't running.

$(document).ready(function () {

    // figure out which page we're on so we can show the right model info
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('[Data Loader] Page detected:', currentPage);

    // the two places we can get the data from
    const phpEndpoint = 'api/get_models.php';   
    const jsonFallback = 'data.json';            

    // try PHP first
    $.getJSON(phpEndpoint, function (data) {
        console.log('[Data Loader] ✓ Loaded from PHP/SQLite backend');
        console.log('[Data Loader] Site:', data.siteName);
        console.log('[Data Loader] Models found:', data.models.length);

        injectContent(data, currentPage);

    }).fail(function (jqxhr, textStatus, error) {
        // PHP didn't respond. it try the JSON file instead
        console.warn('[Data Loader] PHP endpoint failed, falling back to data.json');
        console.warn('[Data Loader] Reason:', textStatus, error);

        $.getJSON(jsonFallback, function (data) {
            console.log('[Data Loader] ✓ Loaded from data.json fallback');
            console.log('[Data Loader] Site:', data.siteName);
            console.log('[Data Loader] Models found:', data.models.length);

            injectContent(data, currentPage);

        }).fail(function (jqxhr, textStatus, error) {
            
            console.error('[Data Loader] Both endpoints failed:', textStatus, error);
        });
    });

    // takes the data from either source and drops it into the right spots on the page
    function injectContent(data, currentPage) {
        // find the model that matches whatever page we're on
        const model = data.models.find(function (m) {
            return m.page === currentPage;
        });

        // only do this if we actually found one 
        if (model) {
            console.log('[Data Loader] Loading content for:', model.fullTitle);
            $('[data-content="model-title"]').text(model.fullTitle);
            $('[data-content="model-description"]').text(model.longDescription);
            $('[data-content="model-technical"]').text(model.technicalNote);
        }

        // site name shows on every page so set this regardless
        $('[data-content="site-name"]').text(data.siteName);
    }
});