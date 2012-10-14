// RequireJS based optimizer for JavaScript and CSS.

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

var requirejs = require('requirejs'),
    config = {
        appDir: 'app',
        baseUrl: 'client',
        dir: 'app.build',
        modules: [
            {
                name: 'game',
                include: ['vendor/almond'],
                insertRequire: ['game']
            }
        ],
        removeCombined: true,
        wrap: true,
        useStrict: true,
        fileExclusionRegExp: /^\.|^server$|\.md$|^require\.js$/,
        cssImportIgnore: 'reset.css' // not important
    };

module.exports = function (onBuildCreated) {
    requirejs.optimize(config, function () {
        onBuildCreated();
    });
};
