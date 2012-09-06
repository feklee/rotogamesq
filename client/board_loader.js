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

define(function () {
    'use strict';

    // Returns the specified triple as RGB string.
    function rgbFromTriple(triple) {
        return ('rgb(' +
                triple[0] + ',' +
                triple[1] + ',' +
                triple[2] + ')');
    }

    // Reads the color values of the image into rows of hex values. Ignores the
    // alpha channel.
    function rowsFromCtx(ctx, width, height) {
        var rows, cols, xT, yT, triple, offs,
            sideLenT = Math.min(width, height), // forces square dimensions
            imgData = ctx.getImageData(0, 0, sideLenT, sideLenT).data;

        rows = [];
        for (yT = 0; yT < sideLenT; yT += 1) {
            cols = [];
            for (xT = 0; xT < sideLenT; xT += 1) {
                offs = 4 * (yT * sideLenT + xT);
                triple = imgData.subarray(offs, offs + 3);
                cols.push(rgbFromTriple(triple));
            }
            rows.push(cols);
        }

        return rows;
    }

    // Loads rows (composed of squares), describing the layout of a board. The
    // data is read from the specified graphics file.
    function loadRows(imgUrl, onRowsLoaded) {
        var img = new Image();

        img.onload = function () {
            var tmpCanvas = document.createElement('canvas'),
                ctx = tmpCanvas.getContext('2d');
            tmpCanvas.width = img.width;
            tmpCanvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            onRowsLoaded(rowsFromCtx(ctx, img.width, img.height));
        };
        img.src = imgUrl;
    }

    function allRowsAreLoaded(board) {
        return (board.hasOwnProperty('rows') &&
                board.hasOwnProperty('endRows'));
    }

    function onAllRowsLoaded(board, onLoaded) {
        Object.defineProperty(board, 'sideLenT', {value: board.rows.length});
        onLoaded(board);
    }

    // Start rows form the *mutable* start layout of blocks, i.e. the current
    // state of the board.
    function onStartRowsLoaded(board, rows, onLoaded) {
        Object.defineProperty(board, 'rows', {value : rows});
        if (allRowsAreLoaded(board)) {
            onAllRowsLoaded(board, onLoaded);
        }
    }

    // Start rows form the *immutable* start layout of blocks, the destination
    // state of the board.
    function onEndRowsLoaded(board, rows, onLoaded) {
        Object.defineProperty(board, 'endRows', {value : rows});
        if (allRowsAreLoaded(board)) {
            onAllRowsLoaded(board, onLoaded);
        }
    }

    function imgUrl(name, type) {
        return 'boards/' + name + '/' + type + '.gif';
    }

    // Loads the board, and calls `onLoaded(board)` when done.
    function load(name, onLoaded) {
        var board = {};

        Object.defineProperty(board, 'endImgUrl',
                              {value: imgUrl(name, 'end')});

        loadRows(imgUrl(name, 'start'), function (rows) {
            onStartRowsLoaded(board, rows, onLoaded);
        });
        loadRows(imgUrl(name, 'end'), function (rows) {
            onEndRowsLoaded(board, rows, onLoaded);
        });
    }

    return {
        load: load
    };
});
