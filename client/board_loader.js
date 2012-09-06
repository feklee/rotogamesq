// Loads a board and returns it as an object.

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

/*jslint browser: true, devel: true, maxerr: 50, maxlen: 79 */

/*global define */

define(['board_prototype'], function (boardPrototype) {
    'use strict';

    // Returns the specified triple as RGB string.
    function rgb(imgData, offs) {
        return ('rgb(' +
                imgData[offs] + ',' +
                imgData[offs + 1] + ',' +
                imgData[offs + 2] + ')');
    }

    // Reads the color values of the image into a two dimensional array of hex
    // values. Ignores the alpha channel.
    function tilesFromCtx(ctx, width, height) {
        var tiles, tilesColumn, xT, yT, triple, offs,
            sideLenT = Math.min(width, height), // forces square dimensions
            imgData = ctx.getImageData(0, 0, sideLenT, sideLenT).data;

        tiles = [];
        for (xT = 0; xT < sideLenT; xT += 1) {
            tilesColumn = [];
            for (yT = 0; yT < sideLenT; yT += 1) {
                offs = 4 * (yT * sideLenT + xT);
                tilesColumn.push(rgb(imgData, offs));
            }
            tiles.push(tilesColumn);
        }

        return tiles;
    }

    // Loads tiles (each identified by a color specifier), describing the
    // layout of a board. The data is read from the specified graphics file.
    function loadTiles(imgUrl, onTilesLoaded) {
        var img = new Image();

        img.onload = function () {
            var tmpCanvas = document.createElement('canvas'),
                ctx = tmpCanvas.getContext('2d');
            tmpCanvas.width = img.width;
            tmpCanvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            onTilesLoaded(tilesFromCtx(ctx, img.width, img.height));
        };
        img.src = imgUrl;
    }

    function allTilesAreLoaded(board) {
        return (board.hasOwnProperty('tiles') &&
                board.hasOwnProperty('endTiles'));
    }

    function onAllTilesLoaded(board, onLoaded) {
        Object.defineProperty(board, 'sideLenT', {value: board.tiles.length});
        onLoaded(board);
    }

    // Start tiles form the *mutable* start layout of blocks, i.e. the current
    // state of the board.
    function onStartTilesLoaded(board, tiles, onLoaded) {
        Object.defineProperty(board, 'tiles', {value : tiles});
        if (allTilesAreLoaded(board)) {
            onAllTilesLoaded(board, onLoaded);
        }
    }

    // Start tiles form the *immutable* start layout of blocks, the destination
    // state of the board.
    function onEndTilesLoaded(board, tiles, onLoaded) {
        Object.defineProperty(board, 'endTiles', {value : tiles});
        if (allTilesAreLoaded(board)) {
            onAllTilesLoaded(board, onLoaded);
        }
    }

    function imgUrl(name, type) {
        return 'boards/' + name + '/' + type + '.gif';
    }

    // Loads the board, and calls `onLoaded(board)` when done.
    function load(name, onLoaded) {
        var board = Object.create(boardPrototype);

        loadTiles(imgUrl(name, 'start'), function (tiles) {
            onStartTilesLoaded(board, tiles, onLoaded);
        });
        loadTiles(imgUrl(name, 'end'), function (tiles) {
            onEndTilesLoaded(board, tiles, onLoaded);
        });
    }

    return Object.defineProperties({}, {
        'load': {value: load}
    });
});
