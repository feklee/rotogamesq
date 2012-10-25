// Returns an object with handlers for different resources.

// Copyright 2012 Felix E. Klee <felix.klee@inka.de>
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

/*jslint node: true, maxerr: 50, maxlen: 79, nomen: true, unparam: true */

'use strict';

var manifestAppcache;

module.exports = function (env, version) {
    var readFileSync = require('fs').readFileSync,
        manifestAppcacheInc = readFileSync('views/' + env + '.appcache.inc',
                                           'utf8'),
        manifestAppcacheContent;

    manifestAppcacheContent = ('CACHE MANIFEST\n' +
                               '# ROTOGAMEsq ' +
                               (env === 'development' ?
                                'development' :
                                'v' + version) +
                               '\n\n' +
                               manifestAppcacheInc);

    return Object.create(null, {
        index: {value: function (req, res) {
            res.render('index', {env: env});
        }},
        installWebapp: {value: function (req, res) {
            res.render('install-webapp');
        }},
        manifestAppcache: {value: function (req, res) {
            // fixme: set mime-type
            res.set('Content-Type', 'text/cache-manifest');
            res.send(manifestAppcacheContent);
        }}
    });
};
