// Utility functionality.

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
    'use strict';

    return Object.create(null, {
        whenDocumentIsReady: {value: function (onDocumentIsReady) {
            if (document.readyState === 'complete') {
                onDocumentIsReady();
            } else {
                document.addEventListener('readystatechange', function () {
                    if (document.readyState === 'complete') {
                        onDocumentIsReady();
                    }
                });
            }
        }},

        clear: {value: function (el) {
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
        }},


        // Returns position of element on viewport, in pixels.
        viewportPos: {value: function (el) {
            var rect = el.getBoundingClientRect();
            return [rect.left, rect.top];
        }}
    });
});
