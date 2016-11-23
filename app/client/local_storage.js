// For interfacing with the localStorage API.

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
