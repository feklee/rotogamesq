// Panel that shows information such as the game's name.

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

define([
    'boards_navigator', 'rotations_navigator'
], function (boardsNavigator, rotationsNavigator) {
    'use strict';

    var width, height,
        needsToBeRendered = true,
        isVisible = false;

    function render() {
        var el = document.getElementById('panel'),
            style = el.style,
            padding = Math.round(0.01 * width);

        style.display = 'block'; // unhides, if previously hidden
        style.padding = padding + 'px';
        style.width = (width - 2 * padding) + 'px';
        style.height = (height - 2 * padding) + 'px';
        style.left = height + 'px';
        style.fontSize = Math.ceil(height / 25) + 'px';
    }

    return Object.create(null, {
        animStep: {value: function () {
            if (isVisible) {
                if (needsToBeRendered) {
                    render();
                    needsToBeRendered = false;
                }

                boardsNavigator.animStep();
                rotationsNavigator.animStep();
            }
        }},

        show: {value: function () {
            isVisible = true;
            boardsNavigator.activate();
            needsToBeRendered = true;
        }},

        width: {set: function (x) {
            if (x !== width) {
                width = x;
                boardsNavigator.width = width;
                needsToBeRendered = true;
            }
        }},

        height: {set: function (newHeight) {
            if (newHeight !== height) {
                height = newHeight;
                needsToBeRendered = true;
            }
        }}
    });
});
