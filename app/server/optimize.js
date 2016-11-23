// RequireJS based optimizer for JavaScript and CSS.

/*jslint node: true, maxlen: 80 */

'use strict';

var requirejs = require('requirejs'),
    config = {
        appDir: 'app',
        baseUrl: 'client',
        dir: 'app.build',
        modules: [
            {
                name: 'main',
                include: ['vendor/almond'],
                insertRequire: ['main']
            }
        ],
        removeCombined: true,
        wrap: true,
        useStrict: true,
        fileExclusionRegExp: /^\.|^server$|\.md$|^require\.js$/,
        optimizeCss: 'standard'
    };

module.exports = function (onBuildCreated) {
    requirejs.optimize(config, function () {
        onBuildCreated();
    });
};
