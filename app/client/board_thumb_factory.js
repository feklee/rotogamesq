// Creates thumbnails of boards, showing the tiles of the finished board ("end
// tiles").

/*jslint browser: true, maxlen: 80 */

/*global define */

define(["boards"], function (boards) {
    "use strict";

    var posFromPosT = function (posT, sideLen, sideLenT) {
        return posT.map(function (coordT) {
            return coordT * sideLen / sideLenT;
        });
    };

    var renderTile = function (ctx, board, posT, maxSideLenCeil) {
        var sideLenT = board.sideLenT;
        var tiles = board.endTiles;
        var pos = posFromPosT(posT, maxSideLenCeil, sideLenT);
        var color = tiles[posT[0]][posT[1]].color;
        var tileSideLen = maxSideLenCeil / sideLenT + 1; // +1 to avoid ugly
                                                         // spacing

        ctx.fillStyle = color;
        ctx.fillRect(pos[0], pos[1], tileSideLen, tileSideLen);
    };

    var renderColumn = function (ctx, sideLenT, maxSideLenCeil, board, xT) {
        var yT = 0;
        while (yT < sideLenT) {
            renderTile(ctx, board, [xT, yT], maxSideLenCeil);
            yT += 1;
        }
    };

    // The canvas is only rendered when needed. One reason, aside from low
    // resource consumption, is that with the canvas being rendered repeatedly
    // in a quick succession, sometimes on the iPad with IOS 5.1.1, the canvas
    // drawing on the canvas has no effect after increasing its size - it stays
    // empty. The new code minimizes situations like that.
    var renderCanvas = function (el, board, maxSideLenCeil) {
        var xT = 0;
        var sideLenT = board.sideLenT;
        var ctx = el.getContext("2d");

        while (xT < sideLenT) {
            renderColumn(ctx, sideLenT, maxSideLenCeil, board, xT);
            xT += 1;
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
    var render = function (el, board, sideLen, maxSideLenCeil, x, y,
            canvasNeedsToBeRendered) {
        var s = el.style;

        s.width = sideLen + "px";
        s.height = s.width;
        s.left = (x - sideLen / 2) + "px";
        s.top = (y - sideLen / 2) + "px";

        if (canvasNeedsToBeRendered) {
            el.width = maxSideLenCeil;
            el.height = el.width;
            renderCanvas(el, board, maxSideLenCeil);
        }
    };

    return Object.create(null, {
        create: {value: function (boardI, onThumbSelected) {
            var el = document.createElement("canvas");
            var needsToBeRendered = true;
            var canvasNeedsToBeRendered = true;
            var maxSideLenCeil = 0; // max. side length (size of canvas, int)
            var sideLen = 0; // actual side length, set with CSS
            var x = 0; // x-position of center within outher container
            var y = 0;

            el.addEventListener("click", function () {
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
                        render(
                            el,
                            boards[boardI],
                            sideLen,
                            maxSideLenCeil,
                            x,
                            y,
                            canvasNeedsToBeRendered
                        );
                        needsToBeRendered = false;
                        canvasNeedsToBeRendered = false;
                    }
                }}
            });
        }}
    });
});
