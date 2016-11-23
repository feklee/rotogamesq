// Gives access to image with boards sprites: Every sprite describes the start
// or end layout of a board's tiles.

/*jslint node: true, maxlen: 80 */

'use strict';

var pngJs = require('png-js'),
    tilesFactory = require('../common/tiles_factory'),
    imgWidth,
    imgData;

// Loads boards sprites.
exports.load = function (onLoaded) {
    var png = pngJs.load('public/images/boards_sprites.png');

    png.decode(function (x) {
        imgData = x;
        imgWidth = png.width;
        onLoaded();
    });
};

exports.tiles = function (posT, sideLenT) {
    return tilesFactory.createFromImgData(imgData, imgWidth, posT, sideLenT);
};
