// Shows arrow indicating direction of rotation.

/*jslint browser: true, maxlen: 80 */

/*global define */

define([
    'display_c_sys', 'display_canvas_factory'
], function (displayCSys, displayCanvasFactory) {
    'use strict';

    var sideLen,
        needsToBeRendered = false,
        rotation,
        object,
        renderArc,
        renderTriangle,
        renderArrow,
        render,
        origShow;

    renderArc = function (ctx, x, y, u, angleDeg) {
        var startAngle = 0,
            endAngle = (angleDeg === 90 || angleDeg === -90 ?
                        Math.PI / 2 : Math.PI);

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

    renderTriangle = function (ctx, x, y, u, angleDeg) {
        var s;

        ctx.beginPath();
        if (angleDeg === 90 || angleDeg === 180 || angleDeg === -180) {
            s = (angleDeg === -180) ? -3 * u : 0;
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

    renderArrow = function (ctx, posT, angleDeg) {
        var pos = displayCSys.posFromPosT(posT),
            x = pos[0],
            y = pos[1],
            tsl = displayCSys.tileSideLen,
            u = tsl / 14;

        ctx.lineWidth = u;
        renderArc(ctx, x, y, u, angleDeg);
        renderTriangle(ctx, x, y, u, angleDeg);
    };

    render = function (el) {
        var ctx = el.getContext('2d');

        el.height = el.width = sideLen; // also clears canvas

        if (rotation !== undefined && rotation.makesSense) {
            renderArrow(ctx, rotation.rectT[1], rotation.angleDeg);
        }
    };

    object = Object.create(displayCanvasFactory.create(), {
        animStep: {value: function () {
            var el = document.getElementById('arrowCanvas');

            if (this.visibilityNeedsToBeUpdated) {
                this.updateVisibility(el);
                if (this.isVisible) {
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
                if (this.isVisible) {
                    needsToBeRendered = true;
                }
            }
        }},

        sideLen: {set: function (x) {
            if (x !== sideLen) {
                sideLen = x;
                if (this.isVisible) {
                    needsToBeRendered = true;
                }
            }
        }}
    });

    origShow = object.show;

    Object.defineProperty(
        object,
        'show',
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
