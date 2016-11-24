// The game.

/*jslint browser: true, maxlen: 80 */

/*global define */

define([
    'display', 'boards', 'title', 'rotations_navigator', 'hiscores_table',
    'boards_navigator', 'util', 'vendor/rAF'
], function (
    display,
    boards,
    title,
    rotationsNavigator,
    hiscoresTable,
    boardsNavigator,
    util
) {
    'use strict';

    var updateComponentsLandscapeLayout, updateLandscapeLayout,
        updateComponentsPortraitLayout, updatePortraitLayout,
        updateLayout, animStep, doNotUpdateLayout, onResize,
        hideLoadScreen, onBoardsLoaded, onDocumentComplete, preventPageDrag,
        loaded = false,
        goldenRatio = 1.61803398875,
        width, // px
        height; // px

    // Updates GUI components for landscape layout.
    updateComponentsLandscapeLayout = function (width, height) {
        // panel = panel with all the elements on the right of the board
        var panelWidth = width - height,
            panelLeft = height,
            panelInsideMargin = Math.round(0.05 * panelWidth),
            panelInsideWidth = panelWidth - 2 * panelInsideMargin,
            panelInsideLeft = panelLeft + panelInsideMargin;

        display.layout = {
            sideLen: height,
            top: 0
        };
        title.layout = {
            portrait: false,
            width: panelWidth,
            left: panelLeft,
            height: Math.round(0.1 * height)
        };
        boardsNavigator.layout = {
            portrait: false,
            width: panelInsideWidth,
            height: Math.round((width - height) / 4),
            left: panelInsideLeft,
            top: Math.round(0.99 * height - (width - height) / 4)
        };
        rotationsNavigator.layout = {
            portrait: false,
            width: panelInsideWidth,
            height: Math.round(0.1 * height),
            left: panelInsideLeft,
            top: Math.round(0.135 * height)
        };
        hiscoresTable.layout = {
            portrait: false,
            width: panelInsideWidth,
            height: Math.round(0.5 * height),
            left: panelInsideLeft,
            top: Math.round(0.28 * height)
        };
    };

    // Gives the game lanscape layout. The game is sized so that it takes up
    // the space of a golden ratio rectangle that takes up maximum space in the
    // browser window.
    updateLandscapeLayout = function (viewportWidth, viewportHeight) {
        var viewportRatio = viewportWidth / viewportHeight,
            s = document.body.style;

        if (viewportRatio < goldenRatio) {
            width = viewportWidth;
            height = Math.round(width / goldenRatio);
        } else {
            height = viewportHeight;
            width = Math.round(height * goldenRatio);
        }

        s.width = width + 'px';
        s.height = height + 'px';
        s.margin = 0;

        if (loaded) {
            updateComponentsLandscapeLayout(width, height);
        }
    };

    // Updates components for portrait layout.
    updateComponentsPortraitLayout = function (width, height) {
        var remainingHeight = height - width, // height without board display 
            componentHeight,
            componentTop,
            horizontalMargin = 0.01 * width;

        componentTop = 0;
        componentHeight = Math.round(remainingHeight * 0.2);
        title.layout = {
            portrait: true,
            height: componentHeight,
            leftMargin: horizontalMargin
        };
        rotationsNavigator.layout = {
            portrait: true,
            height: componentHeight,
            top: componentTop,
            rightMargin: horizontalMargin
        };
        componentTop += componentHeight;
        componentHeight = width;
        display.layout = {
            sideLen: componentHeight,
            top: componentTop
        };
        componentTop += componentHeight + remainingHeight * 0.03;
        componentHeight = Math.round(remainingHeight * 0.33);
        boardsNavigator.layout = {
            portrait: true,
            width: width - 2 * horizontalMargin,
            height: componentHeight,
            top: componentTop,
            horizontalMargin: horizontalMargin
        };
        componentTop += componentHeight + remainingHeight * 0.05;
        componentHeight = Math.round(remainingHeight * 0.39);
        hiscoresTable.layout = {
            portrait: true,
            width: width - 2 * horizontalMargin,
            height: componentHeight,
            top: componentTop,
            horizontalMargin: horizontalMargin
        };
    };

    // Gives the game portrait layout. The game is sized so that it takes up
    // maximum space in the browser window. It's aspect ratio is set in limits:
    // between 3:4 and reciprocal golden ratio.
    updatePortraitLayout = function (viewportWidth, viewportHeight) {
        var viewportRatio = viewportWidth / viewportHeight,
            s = document.body.style;

        width = viewportWidth;
        height = viewportHeight;

        // restricts aspect ratio:
        if (viewportRatio < 1 / goldenRatio) {
            // thinner than reciprocal golden ratio => restrict height
            height = Math.round(width * goldenRatio);
        } else if (viewportRatio > 3 / 4) {
            // wider than 3:4 => restrict width
            width = Math.round(height * 3 / 4);
        }

        s.width = width + 'px';
        s.height = height + 'px';
        s.margin = '0 auto'; // centers horizontally

        if (loaded) {
            updateComponentsPortraitLayout(width, height);
        }
    };

    updateLayout = function () {
        var viewportWidth = window.innerWidth,
            viewportHeight = window.innerHeight;

        if (viewportWidth > viewportHeight) {
            updateLandscapeLayout(viewportWidth, viewportHeight);
        } else {
            updatePortraitLayout(viewportWidth, viewportHeight);
        }
    };

    animStep = function () {
        display.animStep();
        title.animStep();
        boardsNavigator.animStep();
        rotationsNavigator.animStep();
        hiscoresTable.animStep();

        window.requestAnimationFrame(animStep);
    };

    doNotUpdateLayout = function () {
        // At least on iOS 6.0 devices, updating layout causes loss of keyboard
        // focus, since focus cannot be reassigned after redrawing. See also:
        //
        // <url:http://stackoverflow.com/questions/15797991/
        // check-if-keyboard-focus-can-be-set-by-javascript>
        //
        // As of October 2013, the issue has also been detected on Firefox OS
        // 1.3 nightly running on a Geeksphone Keon.
        //
        // => It's better not to update layout when the hiscores table has
        // (keyboard) focus.
        return hiscoresTable.hasFocus;
    };

    onResize = function () {
        if (!doNotUpdateLayout()) {
            updateLayout();
        }
    };

    hideLoadScreen = function () {
        document.getElementById('loadScreen').style.display = 'none';
    };

    // Needed e.g. on iOS 6 to prevent default dragging of page.
    preventPageDrag = function () {
        var preventDefault = function (e) {
            e.preventDefault();
        };

        document.addEventListener('touchmove', preventDefault);

        // Don't prevent default on `touchstart`. See also:
        // <http://stackoverflow.com/a/13720649>
    };

    onDocumentComplete = function () {
        loaded = true;

        hideLoadScreen();

        // Resize not beforen now, to avoid jumpy load screen animation.
        onResize(); // captures initial size
        window.addEventListener('resize', onResize);

        display.isVisible = true;
        boardsNavigator.activate();
        updateLayout();

        animStep(); // Refreshes display right away (to avoid flicker), then
                    // continues with animation
    };

    onBoardsLoaded = function () {
        util.onceDocumentIsComplete(onDocumentComplete);
    };

    util.autoRefreshAppCache();

    util.onceDocumentIsInteractive(function () {
        preventPageDrag();
        boards.load(onBoardsLoaded);
    });
});
