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

    var isVisible = true,
        needsToBeRendered = true,
        width;

    function render() {
        var style = document.getElementById('loadIndicator').style;

        style.fontSize = Math.ceil(width / 20) + 'px';
        style.top = style.left = Math.round(0.01 * width);
    }

    return Object.create(null, {
        animStep: {value: function (newWidth) {
            var style;

            if (isVisible && needsToBeRendered) {
                render();
                needsToBeRendered = false;
            }
        }},

        hide: {value: function () {
            document.getElementById('loadIndicator').style.display = 'none';
            isVisible = false;
        }},

        width: {set: function (x) {
            if (x !== width) {
                width = x;
                needsToBeRendered = true;
            }
        }}
    });
});
