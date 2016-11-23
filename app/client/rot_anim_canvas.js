// Shows rotation animation.

/*jslint browser: true, maxlen: 80 */

/*global define */

define([
    'boards', 'display_c_sys', 'display_canvas_factory'
], function (boards, displayCSys, displayCanvasFactory) {
    'use strict';

    var renderTile, render, passedTime, rotationIsFinished, updateAngle,
        sideLen,
        tiles, // tiles, in position *after* rotation
        animIsRunning,
        rectT, // tiles inside of this rectangle are rotated
        startTime, // time when animation started, in milliseconds
        startAngle, // rad
        angle, // current angle, in rad
        direction, // rotation direction (-1, or +1)
        board;

    renderTile = function (ctx, posT, rotCenter) {
        var pos = displayCSys.posFromPosT(posT),
            color = tiles[posT[0]][posT[1]].color,
            tileSideLen = displayCSys.tileSideLen;

        ctx.fillStyle = color;
        ctx.fillRect(pos[0] - rotCenter[0], pos[1] - rotCenter[1],
                     tileSideLen, tileSideLen);
    };

    render = function (el) {
        var xT, yT,
            ctx = el.getContext('2d'),
            xMinT = rectT[0][0],
            yMinT = rectT[0][1],
            xMaxT = rectT[1][0],
            yMaxT = rectT[1][1],
            center = displayCSys.posFromPosT(rectT.centerT),
            rotCenter = [center[0] + displayCSys.tileSideLen / 2,
                         center[1] + displayCSys.tileSideLen / 2];

        el.width = el.height = sideLen; // also clears canvas

        ctx.save();
        ctx.translate(rotCenter[0], rotCenter[1]);
        ctx.rotate(angle);

        for (xT = xMinT; xT <= xMaxT; xT += 1) {
            for (yT = yMinT; yT <= yMaxT; yT += 1) {
                renderTile(ctx, [xT, yT], rotCenter);
            }
        }

        ctx.restore();
    };

    passedTime = function () {
        return Date.now() - startTime;
    };

    rotationIsFinished = function () {
        return direction < 0 ? angle <= 0 : angle >= 0;
    };

    updateAngle = function () {
        var speed = 0.004; // rad / ms

        angle = startAngle + direction * speed * passedTime();

        if (rotationIsFinished()) {
            angle = 0; // avoids rotation beyond 0 (would look ugly)
        }
    };

    return Object.create(displayCanvasFactory.create(), {
        animStep: {value: function () {
            var el = document.getElementById('rotAnimCanvas');

            if (this.visibilityNeedsToBeUpdated) {
                this.updateVisibility(el);
            }

            if (animIsRunning) {
                updateAngle();
                if (!rotationIsFinished()) {
                    render(el);
                } else {
                    animIsRunning = false;
                    this.hide();
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
            this.show();
        }}
    });
});
