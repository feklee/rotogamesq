// Factory for individual tiles that are displayed on screen.

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

/*jslint browser: true, devel: true, maxerr: 50, maxlen: 79 */

/*global define */

// fixme: create arrow, if rotation is non-null

define(function () {
    'use strict';

    return Object.create(null, {
        create: {value: function (posP, sideLenP, color, highlighted) {
            var el, s, c;

            el = document.createElement('div');
            s = el.style;
            s.position = 'absolute';
            s.left = posP[0] + '%';
            s.top = posP[1] + '%';
            s.width = s.height = sideLenP + '%';
            s.background = color;

            c = 'tile';
            if (highlighted) {
                c += ' highlighted';
            }
            el.className = c;

            return el;
        }}
    });
});
