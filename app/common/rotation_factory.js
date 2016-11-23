// Creates objects that describe rotations.

/*jslint node: true, maxlen: 80 */

/*global define */

if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function () {
    'use strict';

    var prototype, create;

    // Returns false if `rectT` is false or `cw` is not boolean.
    create = function (rectT, cw) {
        if (!rectT || typeof cw !== 'boolean') {
            return false;
        }

        return Object.create(prototype, {
            rectT: {get: function () { return rectT; },
                    enumerable: true},

            // direction (true: clock wise)
            cw: {get: function () { return cw; },
                 enumerable: true}
        });
    };

    prototype = Object.create(null, {
        isEqualTo: {value: function (rotation) {
            return (this.rectT.isEqualTo(rotation.rectT) &&
                    this.cw === rotation.cw);
        }},

        // rotations of just one tile don't make sense
        makesSense: {get: function () {
            return this.rectT.widthT > 0 || this.rectT.heightT > 0;
        }},

        direction: {get: function () {
            return this.cw ? -1 : 1;
        }},

        angleRad: {get: function () {
            return this.direction * (this.rectT.isSquare ?
                                     Math.PI / 2 : Math.PI);
        }},

        angleDeg: {get: function () {
            return this.direction * (this.rectT.isSquare ? 90 : 180);
        }},

        inverse: {get: function () {
            return create(this.rectT, !this.cw);
        }}
    });

    return Object.create(null, {
        create: {value: create}
    });
});
