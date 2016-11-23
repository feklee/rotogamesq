// Functionality for the Open Web App installation page: /install_webapp

/*jslint browser: true, maxerr: 50, maxlen: 79 */

(function () {
    'use strict';

    var onDocumentIsReady, install, host;

    host = function () {
        var l = window.location;
        return l.protocol + '//' + l.host;
    };

    install = function () {
        var request;

        if (navigator && navigator.mozApps && navigator.mozApps.install) {
            request = navigator.mozApps.install(host() + '/manifest.webapp');
            request.onsuccess = function () {
                window.alert('Installation succeeded!');
            };
            request.onerror = function () {
                window.alert('Installation failed: ' + this.error.name);
            };
        } else {
            window.alert('`navigator.mozApps.install` not defined.');
        }
    };

    onDocumentIsReady = function () {
        var request,
            installButtonEl = document.getElementById('installButton');

        installButtonEl.addEventListener('click', install);
    };

    if (document.readyState === 'complete') {
        onDocumentIsReady();
    } else {
        document.addEventListener('readystatechange', function () {
            if (document.readyState === 'complete') {
                onDocumentIsReady();
            }
        });
    }
}());
