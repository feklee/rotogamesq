// Creates thumbnails of boards, showing the tiles of the finished board ("end
// tiles").

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

    function posFromPosT(posT, sideLen, sideLenT) {
        return posT.map(function (coordT) {
            return coordT * sideLen / sideLenT;
        });
    }

    function renderTile(ctx, board, posT, sideLen) {
        var sideLenT = board.sideLenT,
            tiles = board.endTiles,
            pos = posFromPosT(posT, sideLen, sideLenT),
            color = tiles[posT[0]][posT[1]],
            tileSideLen = sideLen / sideLenT + 1; // +1 to avoid ugly spacing

        ctx.fillStyle = color;
        ctx.fillRect(pos[0], pos[1], tileSideLen, tileSideLen);
    }

    // Renders the board to canvas.
    //
    // Why not simply display the board image in an `<img>` tag, and scale
    // that? Rationale: As of Chrome 21.0, when scaling an image in an `<img>`
    // tag, then it is smoothed/blurred, and there is no way to turn off that
    // behavior. In particular, there is no equivalent to Firefox 14.0's
    // `-moz-crisp-edges`.
    function render(el, board, sideLen) {
        var xT, yT,
            sideLenT = board.sideLenT,
            ctx = el.getContext('2d');

        el.width = el.height = sideLen; // also clears canvas

        for (xT = 0; xT < sideLenT; xT += 1) {
            for (yT = 0; yT < sideLenT; yT += 1) {
                renderTile(ctx, board, [xT, yT], sideLen);
            }
        }
    }

    return Object.defineProperties({}, {
        create: {value: function (board) {
            var el = document.createElement('canvas'),
                renderRequested = true,
                sideLen = 0;

            return Object.create(null, {
                el: {get: function () {
                    return el;
                }},
                sideLen: {set: function (x) {
                    if (x !== sideLen) {
                        sideLen = x;
                        renderRequested = true;
                    }
                }},
                board: {set: function (x) {
                    if (x !== board) {
                        board = x;
                        renderRequested = true;
                    }
                }},
                animationStep: {value: function () {
                    if (renderRequested) {
                        render(el, board, sideLen);
                        renderRequested = false;
                    }
                }}
            });
        }}
    });
});
