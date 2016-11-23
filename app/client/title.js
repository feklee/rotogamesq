// Title.

/*jslint browser: true, maxlen: 80 */

/*global define */

define(function () {
    'use strict';

    var style, render,
        needsToBeRendered = true,
        layout = {width: 1, height: 1, portrait: false};

    style = function () {
        return document.getElementById('title').style;
    };

    render = function () {
        var s = style();

        s.lineHeight = s.height = layout.height + 'px';
        s.fontSize = (0.8 * layout.height) + 'px';
        if (layout.portrait) {
            s.left = 0;
            s.marginLeft = layout.leftMargin + 'px';
            s.textAlign = 'left';
            s.width = 'auto';
        } else {
            s.left = layout.left + 'px';
            s.marginLeft = 0;
            s.textAlign = 'center';
            s.width = layout.width + 'px';
        }
    };

    return Object.create(null, {
        animStep: {value: function () {
            if (needsToBeRendered) {
                render();
                needsToBeRendered = false;
            }
        }},

        layout: {set: function (newLayout) {
            layout = newLayout;
            needsToBeRendered = true;
        }}
    });
});
