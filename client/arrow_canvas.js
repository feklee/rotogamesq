// Shows arrow indicating direction of rotation.

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

define(['display_c_sys'], function (displayCSys) {
    'use strict';

    var sideLen,
        isVisible = false,
        visibilityNeedsToBeUpdated = true,
        needsToBeRendered = true;

    function render() {
        
    }

    function updateVisibility(el) {
        if (isVisible) {
            el.style.display = 'block';
            needsToBeRendered = true;
        } else {
            el.style.display = 'none';
        }
        visibilityNeedsToBeUpdated = false;
    }

    return Object.create(null, {
        animationStep: {value: function () {
            var el = document.getElementById('arrowCanvas');

            if (visibilityNeedsToBeUpdated) {
                updateVisibility(el);
            }

            if (needsToBeRendered) {
                render(el);
                needsToBeRendered = false;
            }
        }},

        show: {value: function () {
            if (!isVisible) {
                isVisible = true;
                visibilityNeedsToBeUpdated = true;
            }
        }},

        hide: {value: function () {
            if (isVisible) {
                isVisible = false;
                visibilityNeedsToBeUpdated = true;
            }
        }},

        sideLen: {set: function (x) {
            if (x !== sideLen) {
                sideLen = x;
                needsToBeRendered = true;
            }
        }}
    });
});
