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
    'display', 'boards', 'load_indicator',
    'title', 'rotations_navigator', 'hiscores_table', 'boards_navigator',
    'util', 'vendor/rAF'
], function (
    display,
    boards,
    loadIndicator,
    title,
    rotationsNavigator,
    hiscoresTable,
    boardsNavigator,
    util
) {
    'use strict';

    var loaded = false,
        width, // px
        height; // px

    // The game takes up the space of a golden ratio rectangle that takes up
    // maximum space in the browser window.
    function updateLandscapeLayout(viewportWidth, viewportHeight) {
        var goldenRatio = 1.61803398875,
            viewportRatio = viewportWidth / viewportHeight,
            s = document.body.style;

        if (viewportRatio < goldenRatio) {
            width = viewportWidth;
            height = Math.floor(width / goldenRatio);
        } else {
            height = viewportHeight;
            width = Math.floor(height * goldenRatio);
        }

        s.width = width + 'px';
        s.height = height + 'px';

        // fixme: maybe introduce "landscape"

        if (loaded) {
            display.sideLen = height;
            title.layout = {
                width: width - height,
                left: height,
                height: 0.1 * height
            };
            boardsNavigator.layout = {
                width: width - height,
                left: height,
                height: (width - height) / 4,
                top: 0.8 * height
            };
            rotationsNavigator.layout = {
                width: width - height,
                height: 0.1 * height,
                left: height,
                top: 0.135 * height
            };
        }
    }

    function updatePortraitLayout() {
        return; // fixme: do something
    }

    function updateLayout() {
        var viewportWidth = window.innerWidth,
            viewportHeight = window.innerHeight;

        if (viewportWidth > viewportHeight) {
            updateLandscapeLayout(viewportWidth, viewportHeight);
        } else {
            updatePortraitLayout(viewportWidth, viewportHeight);
        }

        loadIndicator.width = width;
    }

    function animStep() {
        if (loaded) {
            display.animStep();
            title.animStep();
            boardsNavigator.animStep();
            rotationsNavigator.animStep();
        } else {
            loadIndicator.animStep();
        }

        window.requestAnimationFrame(animStep);
    }

    function startAnim() {
        window.requestAnimationFrame(animStep);
    }

    function onResize() {
        updateLayout();
    }

    function onLoaded() {
        loaded = true;
        display.show();
        title.show();
        boardsNavigator.show();
        rotationsNavigator.show();
        loadIndicator.hide();
        updateLayout();
    }

    util.whenDocumentIsReady(function () {
        startAnim();
        boards.load(function () {
            onLoaded();
        });
        onResize(); // captures initial size
        window.addEventListener('resize', onResize);
    });
});
