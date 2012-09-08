// Creates thumbnails of boards, showing the tiles of the finished board ("end
// tiles").

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

define(function () {
    'use strict';

    // Renders the board using `div` tags for tiles.
    //
    // Why not simply display the board image in an `<img>` tag, and scale
    // that? Rationale: As of Chrome 21.0, when scaling an image in an `<img>`
    // tag, then it is smoothed/blurred, and there is no way to turn off that
    // behavior. In particular, there is no equivalent to Firefox 14.0's
    // `-moz-crisp-edges`.
    function render(el, board) {
        var xT, yT, s, tileEl,
            sideLenT = board.sideLenT,
            tileSideLenP = (100 / sideLenT);

        for (xT = 0; xT < sideLenT; xT += 1) {
            for (yT = 0; yT < sideLenT; yT += 1) {
                tileEl = document.createElement('div');
                s = tileEl.style;
                s.position = 'absolute';
                s.left = (100 * xT / sideLenT) + '%';
                s.top = (100 * yT / sideLenT) + '%';
                s.width = s.height = tileSideLenP + '%';
                s['background-color'] = board.endTiles[xT][yT];
                el.appendChild(tileEl);
            }
        }
    }

    // Ensures squared aspect ratio. See also:
    //
    // <url:http://stackoverflow.com/questions/12121090/responsively-change-div
    // -size-keeping-aspect-ratio>
    function createWrapperEl(el) {
        var wrapperEl = document.createElement('div'),
            dummyEl = document.createElement('div');

        wrapperEl.style.display = 'inline-block';
        wrapperEl.style.position = 'relative';

        dummyEl.style['padding-top'] = '100%';

        el.style.position = 'absolute';
        el.style.top = el.style.right = el.style.bottom = el.style.left = 0;

        wrapperEl.appendChild(dummyEl);
        wrapperEl.appendChild(el);

        return wrapperEl;
    }

    return Object.defineProperties({}, {
        create: {value: function () {
            var el = document.createElement('div'),
                wrapperEl = createWrapperEl(el);

            return Object.create(null, {
                el: {get: function () {
                    return wrapperEl;
                }},
                render: {value: function (board) {
                    render(el, board);
                }}
            });
        }}
    });
});
