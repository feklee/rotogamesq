// Returns an object with handlers for different resources.

/*jslint node: true, maxerr: 50, maxlen: 79, nomen: true, unparam: true */

'use strict';

module.exports = function (env) {
    /*jslint stupid: true */
    var readFileSync = require('fs').readFileSync,
        packageJson = require('../package.json'),
        openWebAppManifestJson =
            require('../views/open-web-app-manifest.json'),
        amazonWebAppManifestJson;
    /*jslint stupid: false */

    (function () {
        var versionString = (env === 'development' ?
                             '(development, random: ' + Math.random() + ')' :
                             'v' + packageJson.version);

        openWebAppManifestJson.version = packageJson.version;

        amazonWebAppManifestJson = {
            verification_key: process.env.AMAZON_VERIFICATION_KEY || '',
            type: openWebAppManifestJson.type,
            version: openWebAppManifestJson.version,
            created_by: openWebAppManifestJson.developer.name
        };
    }());

    return Object.create(null, {
        index: {value: function (req, res) {
            res.render('index', {
                env: env,
                description: packageJson.description,
                author: packageJson.author,
                repository: packageJson.repository
            });
        }},
        installWebapp: {value: function (req, res) {
            res.render('install-webapp');
        }},
        manifestWebapp: {value: function (req, res) {
            res.set('Content-Type', 'application/x-web-app-manifest+json');
            res.send(JSON.stringify(openWebAppManifestJson));
        }},
        webAppManifestJson: {value: function (req, res) { // for Amazon
            res.set('Content-Type', 'application/json; charset=utf-8');
            res.send(JSON.stringify(amazonWebAppManifestJson));
        }}
    });
};
