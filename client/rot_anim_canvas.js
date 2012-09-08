// Shows rotation animation.

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

define(['boards', 'display_c_sys'], function (boards, displayCSys) {
    'use strict';

    var sideLen,
        tiles, // tiles, in position *after* rotation
        animIsRunning,
        rectT, // tiles inside of this rectangle are rotated
        startTime, // time when animation started, in milliseconds
        startAngle, // rad
        angle, // current angle, in rad
        dir, // rotation direction (-1, or +1)
        isVisible = false,
        board;

    function renderTile(ctx, posT, rotCenter) {
        var pos = displayCSys.posFromPosT(posT),
            color = tiles[posT[0]][posT[1]].color,
            tileSideLen = displayCSys.tileSideLen;

        ctx.fillStyle = color;
        ctx.fillRect(pos[0] - rotCenter[0], pos[1] - rotCenter[1],
                     tileSideLen, tileSideLen);
    }

    function render() {
        var xT, yT,
            el = document.getElementById('rotAnimCanvas'),
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
    }

    function shouldBeVisible() {
        return animIsRunning;
    }

    function visibilityNeedsChange() {
        return shouldBeVisible() !== isVisible;
    }

    function updateVisibility() {
        var el = document.getElementById('rotAnimCanvas');

        isVisible = shouldBeVisible();
        el.style.display = isVisible ? 'block' : 'none';
    }

    function passedTime() {
        return Date.now() - startTime;
    }

    function updateAngle() {
        var speed = 0.004; // rad / s

        angle = startAngle + dir * speed * passedTime();
    }

    function updateDir(rotation) {
        dir = rotation.cw ? 1 : -1;
    }

    function updateStartAngle(rotation) {
        startAngle = ((-dir) *
                      (rotation.rectT.isSquare ? Math.PI / 2 : Math.PI));
    }

    function rotationIsFinished() {
        return dir < 0 ? angle >= 0 : angle <= 0;
    }

    return Object.create(null, {
        animationStep: {value: function () {
            if (visibilityNeedsChange()) {
                updateVisibility();
            }

            if (animIsRunning) {
                updateAngle();
                if (rotationIsFinished()) {
                    render();
                } else {
                    animIsRunning = false;
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
            board = boards.selectedBoard;
            tiles = board.tiles.copy();
            rectT = lastRotation.rectT;
            animIsRunning = true;
            startTime = Date.now();
            updateDir(lastRotation);
            updateStartAngle(lastRotation);
        }}
    });
});
