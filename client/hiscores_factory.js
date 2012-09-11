// Creates lists of top players, associated with a certain board.

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

/*global define */

define(function () {
    // fixme: remove, if unused

    'use strict';

    var maxLength = 7,
        fixmeInit = [
            {name: 'Roger', nRotations: 6},
            {name: 'Larry', nRotations: 8},
            {name: 'Zak', nRotations: 9},
            {name: 'Mario', nRotations: 10},
            {name: 'Gianna', nRotations: 11},
            {name: 'Sonya', nRotations: 12},
            {name: 'Johnny', nRotations: 42}
        ].slice(0, maxLength);

/*fixme:    function loadJson(url) {
        var req = new XMLHttpRequest();

        req.onreadystatechange = function() {
            if (req.readyState == 4 && req.status != 200) {
                // What you want to do on failure
                alert(req.status + " : " + req.responseText);
            }
            if (req.readyState == 4 && req.status == 200) {
                // What you want to do on success
                onSuccessLogin();
            }
        }

        req.open("GET", url + '?' + Date.now(), true);
    }*/

    return Object.create(null, {
        load: {value: function (hiscoresUrl, onLoaded) {
            // fixme: do XHR here (later perhaps Socket.IO)

            onLoaded(fixmeInit);
        }}
    });
});
