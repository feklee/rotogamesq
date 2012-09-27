// Title.

// fixme: perhaps remove

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

    var needsToBeRendered = true,
        layout = {width: 1, height: 1, portrait: false};

    function style() {
        return document.getElementById('title').style;
    }

    function render() {
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
    }

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
