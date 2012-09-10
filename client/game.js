// The game.

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
    'display', 'panel', 'boards', 'load_indicator', 'util', '../vendor/rAF'
], function (
    display,
    panel,
    boards,
    loadIndicator,
    util
) {
    'use strict';

    var width, height; // px

    // The game takes up the space of a golden ratio rectangle that takes up
    // maximum space in the browser window.
    function updateDimensions() {
        var goldenRatio = 1.61803398875,
            innerRatio = window.innerWidth / window.innerHeight;

        if (innerRatio < goldenRatio) {
            width = window.innerWidth;
            height = Math.floor(width / goldenRatio);
        } else {
            height = window.innerHeight;
            width = Math.floor(height * goldenRatio);
        }

        document.body.style.width = width + 'px';
        document.body.style.height = height + 'px';
    }

    function animStep() {
        loadIndicator.animStep();
        display.animStep();
        panel.animStep();

        window.requestAnimationFrame(animStep);
    }

    function startAnim() {
        window.requestAnimationFrame(animStep);
    }

    function onResize() {
        updateDimensions();

        display.sideLen = height;
        panel.width = width - height;
        panel.height = height;

        loadIndicator.width = width;
    }

    util.whenDocumentIsReady(function () {
        startAnim();
        boards.load(function () {
            panel.show();
            display.show();
            loadIndicator.hide();
        });
        onResize(); // captures initial size
        window.addEventListener('resize', onResize);
    });
});
