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

/*jslint browser: true, maxerr: 50, maxlen: 79 */

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
