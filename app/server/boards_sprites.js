// Gives access to image with boards sprites: Every sprite describes the start
// or end layout of a board's tiles.

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

/*jslint node: true, maxerr: 50, maxlen: 79, nomen: true */

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
