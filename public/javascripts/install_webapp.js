// Functionality for the Open Web App installation page: /install_webapp

// Copyright 2012 Felix E. Klee <felix.klee@inka.de>
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

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
