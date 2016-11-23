// Shows arrow indicating direction of rotation.

/*jslint browser: true, maxlen: 80 */

/*global define */

define([
    "display_c_sys", "display_canvas_factory"
], function (displayCSys, displayCanvasFactory) {
    "use strict";

    var needsToBeRendered = false;
    var sideLen;
    var rotation;
    var object;

    var renderArc = function (ctx, x, y, u, angleDeg) {
        var startAngle = 0;
        var endAngle = (angleDeg === 90 || angleDeg === -90)
            ? Math.PI / 2
            : Math.PI;

        // Angle is slightly extended, to avoid small gap to triangle, visible
        // in some browsers as of September 2012 (precision errors).
        if (angleDeg > 0) {
            startAngle -= Math.PI / 8;
        } else {
            endAngle += Math.PI / 8;
        }

        ctx.beginPath();
        ctx.arc(x + 10 * u, y + 10 * u, 1.5 * u, startAngle, endAngle);
        ctx.stroke();
    };

    var renderTriangle = function (ctx, x, y, u, angleDeg) {
        var s;

        ctx.beginPath();
        if (angleDeg === 90 || angleDeg === 180 || angleDeg === -180) {
            s = (angleDeg === -180)
                ? -3 * u
                : 0;
            ctx.moveTo(x + 10 * u + s, y + 10 * u);
            ctx.lineTo(x + 13 * u + s, y + 10 * u);
            ctx.lineTo(x + 11.5 * u + s, y + 8 * u);
            ctx.lineTo(x + 10 * u + s, y + 10 * u);
        } else {
            ctx.moveTo(x + 10 * u, y + 10 * u);
            ctx.lineTo(x + 8 * u, y + 11.5 * u);
            ctx.lineTo(x + 10 * u, y + 13 * u);
            ctx.lineTo(x + 10 * u, y + 10 * u);
        }
        ctx.fill();
        ctx.closePath();
    };

    var renderArrow = function (ctx, posT, angleDeg) {
        var pos = displayCSys.posFromPosT(posT);
        var x = pos[0];
        var y = pos[1];
        var tsl = displayCSys.tileSideLen;
        var u = tsl / 14;

        ctx.lineWidth = u;
        renderArc(ctx, x, y, u, angleDeg);
        renderTriangle(ctx, x, y, u, angleDeg);
    };

    var render = function (el) {
        var ctx = el.getContext("2d");

        // also clears canvas:
        el.height = sideLen;
        el.width = sideLen;

        if (rotation !== undefined && rotation.makesSense) {
            renderArrow(ctx, rotation.rectT[1], rotation.angleDeg);
        }
    };

    var displayCanvas = displayCanvasFactory.create();

    object = Object.create(displayCanvas, {
        animStep: {value: function () {
            var el = document.getElementById("arrowCanvas");

            if (displayCanvas.visibilityNeedsToBeUpdated) {
                displayCanvas.updateVisibility(el);
                if (displayCanvas.isVisible) {
                    needsToBeRendered = true;
                }
            }

            if (needsToBeRendered) {
                render(el);
                needsToBeRendered = false;
            }
        }},

        rotation: {set: function (x) {
            if (rotation === undefined || !rotation.isEqualTo(x)) {
                rotation = x;
                if (displayCanvas.isVisible) {
                    needsToBeRendered = true;
                }
            }
        }},

        sideLen: {set: function (x) {
            if (x !== sideLen) {
                sideLen = x;
                if (displayCanvas.isVisible) {
                    needsToBeRendered = true;
                }
            }
        }}
    });

    var origShow = object.show;

    Object.defineProperty(
        object,
        "show",
        {
            value: function () {
                rotation = undefined; // old rotation can cause popup of arrow
                                      // in old place, rotation first needs to
                                      // be re-set
                return origShow();
            }
        }
    );

    object.hide();

    return object;
});
