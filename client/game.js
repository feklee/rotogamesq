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

    var width, height; // px

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
//fixme:        s.fontSize = Math.ceil(height / 25) + 'px';

        display.sideLen = height;
        [
            title
/*fixme,
            rotationsNavigator,
            hiscoresTable,
            boardsNavigator*/
        ].forEach(function (x) {
// fixme:            x.left = height;
            x.layout = {
                landscape: true,
                width: width - height,
                height: 0.1 * height,
                left: height
            };
/*fixme:            x.renderInLandscapeLayout = true;
            x.width = width;*/
        });
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
    }

    function animStep() {
        loadIndicator.animStep();
        display.animStep();
        title.animStep();

        window.requestAnimationFrame(animStep);
    }

    function startAnim() {
        window.requestAnimationFrame(animStep);
    }

    function onResize() {
        updateLayout();

// fixme:        panel.width = width - height;
// fixme:        panel.height = height;

        loadIndicator.width = width;
    }

    util.whenDocumentIsReady(function () {
        startAnim();
        boards.load(function () {
//fixme:            panel.show();
            display.show();
            loadIndicator.hide();
        });
        onResize(); // captures initial size
        window.addEventListener('resize', onResize);
    });
});
