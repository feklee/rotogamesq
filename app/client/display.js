// Shows the interactive board, for playing.

/*jslint browser: true, maxlen: 80 */

/*global define */

define([
    "tiles_canvas", "arrow_canvas", "rubber_band_canvas", "rot_anim_canvas",
    "display_c_sys"
], function (tilesCanvas, arrowCanvas, rubberBandCanvas, rotAnimCanvas,
             displayCSys) {
    "use strict";

    var style;
    var render;
    var isVisible = false;
    var needsToBeRendered = true;
    var layout = {width: 1, height: 1, left: 0, top: 0};

    style = function () {
        return document.getElementById("display").style;
    };

    render = function () {
        var s = style();

        s.width = layout.sideLen + "px";
        s.height = layout.sideLen + "px";
        s.top = layout.top + "px";
    };

    return Object.create(null, {
        animStep: {value: function () {
            if (isVisible) {
                if (needsToBeRendered) {
                    render();
                    needsToBeRendered = false;
                }
                displayCSys.animStep();
                tilesCanvas.animStep();
                arrowCanvas.animStep();
                rubberBandCanvas.animStep();
                rotAnimCanvas.animStep();
            }
        }},

        layout: {set: function (newLayout) {
            layout = newLayout;
            displayCSys.sideLen = layout.sideLen;
            tilesCanvas.sideLen = layout.sideLen;
            arrowCanvas.sideLen = layout.sideLen;
            rubberBandCanvas.sideLen = layout.sideLen;
            rotAnimCanvas.sideLen = layout.sideLen;
            needsToBeRendered = true;
        }},

        isVisible: {set: function () {
            isVisible = true;
        }}
    });
});
