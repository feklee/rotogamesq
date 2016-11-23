// Gives access to image with boards sprites: Every sprite describes the start
// or end layout of a board's tiles.

/*jslint browser: true, maxlen: 80 */

/*global define */

define(['../common/tiles_factory'], function (tilesFactory) {
    'use strict';

    var img = new Image(),
        canvas,
        ctx;

    return Object.create(null, {
        // Loads boards sprites.
        load: {value: function (onLoaded) {
            img.onload = function () {
                canvas = document.createElement('canvas');
                ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                onLoaded();
            };
            img.src = '/images/boards_sprites.png';
        }},

        tiles: {value: function (posT, sideLenT) {
            return tilesFactory.createFromCtx(ctx, posT, sideLenT);
        }}
    });
});
