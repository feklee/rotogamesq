// Creates thumbnails of boards, showing the tiles of the finished board ("end
// tiles").

/*jslint browser: true, maxlen: 80 */

/*global define */

define(['boards'], function (boards) {
    'use strict';

    var posFromPosT, renderTile, renderCanvas, render;

    posFromPosT = function (posT, sideLen, sideLenT) {
        return posT.map(function (coordT) {
            return coordT * sideLen / sideLenT;
        });
    };

    renderTile = function (ctx, board, posT, maxSideLenCeil) {
        var sideLenT = board.sideLenT,
            tiles = board.endTiles,
            pos = posFromPosT(posT, maxSideLenCeil, sideLenT),
            color = tiles[posT[0]][posT[1]].color,
            tileSideLen = maxSideLenCeil / sideLenT + 1; // +1 to avoid ugly
                                                         // spacing

        ctx.fillStyle = color;
        ctx.fillRect(pos[0], pos[1], tileSideLen, tileSideLen);
    };

    // The canvas is only rendered when needed. One reason, aside from low
    // resource consumption, is that with the canvas being rendered repeatedly
    // in a quick succession, sometimes on the iPad with IOS 5.1.1, the canvas
    // drawing on the canvas has no effect after increasing its size - it stays
    // empty. The new code minimizes situations like that.
    renderCanvas = function (el, board, maxSideLenCeil) {
        var xT, yT,
            sideLenT = board.sideLenT,
            ctx = el.getContext('2d');

        for (xT = 0; xT < sideLenT; xT += 1) {
            for (yT = 0; yT < sideLenT; yT += 1) {
                renderTile(ctx, board, [xT, yT], maxSideLenCeil);
            }
        }
    };

    // Renders the board to canvas, and/or just repositions and scales down the
    // canvas with CSS.
    //
    // Why not simply display the board image in an `<img>` tag, and scale
    // that? Rationale: As of Chrome 21.0, when scaling an image in an `<img>`
    // tag, then it is smoothed/blurred, and there is no way to turn off that
    // behavior. In particular, there is no equivalent to Firefox 14.0's
    // `-moz-crisp-edges`.
    render = function (el, board, sideLen, maxSideLenCeil, x, y,
                       canvasNeedsToBeRendered) {
        var s = el.style;

        s.width = s.height = sideLen + 'px';
        s.left = (x - sideLen / 2) + 'px';
        s.top = (y - sideLen / 2) + 'px';

        if (canvasNeedsToBeRendered) {
            el.width = el.height = maxSideLenCeil;
            renderCanvas(el, board, maxSideLenCeil);
        }
    };

    return Object.create(null, {
        create: {value: function (boardI, onThumbSelected) {
            var el = document.createElement('canvas'),
                needsToBeRendered = true,
                canvasNeedsToBeRendered = true,
                maxSideLenCeil = 0, // max. side length (size of canvas, int)
                sideLen = 0, // actual side length, set with CSS
                x = 0, // x-position of center within outher container
                y = 0;

            el.addEventListener('click', function () {
                onThumbSelected(boardI);
            });

            return Object.create(null, {
                element: {get: function () {
                    return el;
                }},

                boardI: {set: function (newBoardI) {
                    if (newBoardI !== boardI) {
                        boardI = newBoardI;
                        needsToBeRendered = true;
                        canvasNeedsToBeRendered = true;
                    }
                }},

                sideLen: {set: function (newSideLen) {
                    if (newSideLen !== sideLen) {
                        sideLen = newSideLen;
                        needsToBeRendered = true;
                    }
                }},

                maxSideLen: {set: function (newMaxSideLen) {
                    var newMaxSideLenCeil = Math.ceil(newMaxSideLen);
                    if (newMaxSideLenCeil !== maxSideLenCeil) {
                        maxSideLenCeil = newMaxSideLenCeil;
                        needsToBeRendered = true;
                        canvasNeedsToBeRendered = true;
                    }
                }},

                x: {set: function (newX) {
                    if (newX !== x) {
                        x = newX;
                        needsToBeRendered = true;
                    }
                }},

                y: {set: function (newY) {
                    if (newY !== y) {
                        y = newY;
                        needsToBeRendered = true;
                    }
                }},

                animStep: {value: function () {
                    if (needsToBeRendered) {
                        render(el, boards[boardI],
                               sideLen, maxSideLenCeil, x, y,
                               canvasNeedsToBeRendered);
                        needsToBeRendered = false;
                        canvasNeedsToBeRendered = false;
                    }
                }}
            });
        }}
    });
});
