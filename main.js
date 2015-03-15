'use strict';

require.config({
    'baseUrl': 'js/html5video/',
    'paths': {
        'jquery': '//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min',
        'videojs': 'vendor/videojs/dist/video-js/video.dev',
        'mwLoader': 'libs/mwLoader',
        'kWidget': 'libs/kWidget.getSources',
        'app': 'app'
    },
    
});

// Load the main app module to start the app
/*require(['mwLoader'], function(app) {
    console.log('mwLoader is loaded');
    console.log(app);
});*/
requirejs(["app"]);
