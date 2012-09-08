// Shown when the game is loading.

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

    var isVisible = true;

    function el() {
        return document.getElementById('loadIndicator');
    }

    return Object.defineProperties({}, {
        animationStep: {value: function (newWidth) {
            var style;

            if (isVisible) {
                style = el().style;
                style.fontSize = Math.ceil(newWidth / 20) + 'px';
                style.top = style.left = Math.round(0.01 * newWidth);
            }
        }},

        hide: {value: function () {
            isVisible = false;
            el().style.display = 'none';
        }}
    });
});
