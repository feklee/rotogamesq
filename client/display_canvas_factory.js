// Factory for prototypes for any of the canvases used for displaying the
// interactive board.

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

    // Returns true, iff visibility has been updated.
    function updateVisibility(internal, el) {
        if (internal.isVisible) {
            el.style.display = 'block';
            internal.needsToBeRendered = true;
        } else {
            el.style.display = 'none';
        }
        internal.visibilityNeedsToBeUpdated = false;
    }

    function show(internal) {
        if (!internal.isVisible) {
            internal.isVisible = true;
            internal.visibilityNeedsToBeUpdated = true;
        }
    }

    function hide(internal) {
        if (internal.isVisible) {
            internal.isVisible = false;
            internal.visibilityNeedsToBeUpdated = true;
        }
    }

    return Object.create(null, {
        create: {value: function () {
            var internal = {
                isVisible: true,
                visibilityNeedsToBeUpdated: true
            };

            return Object.create(null, {
                visibilityNeedsToBeUpdated: {get: function () {
                    return internal.visibilityNeedsToBeUpdated;
                }},

                updateVisibility: {value: function (el) {
                    updateVisibility(internal, el);
                }},

                show: {value: function () {
                    show(internal);
                }},

                hide: {value: function () {
                    hide(internal);
                }}
            });
        }}
    });
});
