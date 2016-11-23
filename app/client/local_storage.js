// For interfacing with the localStorage API.

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

/*jslint browser: true, maxlen: 80 */

/*global define, io */

define(function () {
    'use strict';

    var namespace = 'rotogamesq';

    return Object.create(null, {
        // Returns null, if object cannot be retrieved from local storage.
        get: {value: function (key) {
            var  json = localStorage.getItem(namespace + '.' + key);

            return json === null ? null : JSON.parse(json);
        }},

        set: {value: function (key, object) {
            localStorage.setItem(namespace + '.' + key,
                                 JSON.stringify(object));
        }}
    });
});
