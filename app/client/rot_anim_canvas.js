// Shows rotation animation.

/*jslint browser: true, maxlen: 80 */

/*global define */

define([
    "boards", "display_c_sys", "display_canvas_factory"
], function (boards, displayCSys, displayCanvasFactory) {
    "use strict";

    var sideLen;
    var tiles; // tiles, in position *after* rotation
    var animIsRunning;
    var rectT; // tiles inside of this rectangle are rotated
    var startTime; // time when animation started, in milliseconds
    var startAngle; // rad
    var angle; // current angle, in rad
    var direction; // rotation direction (-1, or +1)
    var board;

    var renderTile = function (ctx, posT, rotCenter) {
        var pos = displayCSys.posFromPosT(posT);
        var color = tiles[posT[0]][posT[1]].color;
        var tileSideLen = displayCSys.tileSideLen;

        ctx.fillStyle = color;
        ctx.fillRect(
            pos[0] - rotCenter[0],
            pos[1] - rotCenter[1],
            tileSideLen,
            tileSideLen
        );
    };

    var renderColumn = function (yMinT, yMaxT, ctx, xT, rotCenter) {
        var yT = yMinT;

        while (yT <= yMaxT) {
            renderTile(ctx, [xT, yT], rotCenter);
            yT += 1;
        }
    };

    var render = function (el) {
        var ctx = el.getContext("2d");
        var xMinT = rectT[0][0];
        var yMinT = rectT[0][1];
        var xMaxT = rectT[1][0];
        var yMaxT = rectT[1][1];
        var center = displayCSys.posFromPosT(rectT.centerT);
        var rotCenter = [
            center[0] + displayCSys.tileSideLen / 2,
            center[1] + displayCSys.tileSideLen / 2
        ];

        // also clears canvas:
        el.width = sideLen;
        el.height = el.width;

        ctx.save();
        ctx.translate(rotCenter[0], rotCenter[1]);
        ctx.rotate(angle);

        var xT = xMinT;
        while (xT <= xMaxT) {
            renderColumn(yMinT, yMaxT, ctx, xT, rotCenter);
            xT += 1;
        }

        ctx.restore();
    };

    var passedTime = function () {
        return Date.now() - startTime;
    };

    var rotationIsFinished = function () {
        return (direction < 0
            ? angle <= 0
            : angle >= 0);
    };

    var updateAngle = function () {
        var speed = 0.004; // rad / ms

        angle = startAngle + direction * speed * passedTime();

        if (rotationIsFinished()) {
            angle = 0; // avoids rotation beyond 0 (would look ugly)
        }
    };

    var rotAnimCanvas = Object.create(displayCanvasFactory.create());

    return Object.defineProperties(rotAnimCanvas, {
        animStep: {value: function () {
            var el = document.getElementById("rotAnimCanvas");

            if (rotAnimCanvas.visibilityNeedsToBeUpdated) {
                rotAnimCanvas.updateVisibility(el);
            }

            if (animIsRunning) {
                updateAngle();
                if (!rotationIsFinished()) {
                    render(el);
                } else {
                    animIsRunning = false;
                    rotAnimCanvas.hide();
                }
            }
        }},

        sideLen: {set: function (x) {
            sideLen = x;
        }},

        animIsRunning: {get: function () {
            return animIsRunning;
        }},

        isInRotRect: {value: function (posT) {
            return rectT.contains(posT);
        }},

        // Starts new animation, showing the last rotation.
        startAnim: {value: function (lastRotation) {
            board = boards.selected;
            tiles = board.tiles.copy();
            rectT = lastRotation.rectT;
            animIsRunning = true;
            startTime = Date.now();
            direction = -lastRotation.direction;
            startAngle = lastRotation.angleRad;
            rotAnimCanvas.show();
        }}
    });
});
