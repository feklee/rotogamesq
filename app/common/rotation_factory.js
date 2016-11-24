// Creates objects that describe rotations.

/*jslint browser: true, maxlen: 80 */

/*global define, require, module */

if (typeof define !== "function") {
    var define = require("amdefine")(module);
}

define(function () {
    "use strict";

    var create;

    // Returns false if `rectT` is false or `cw` is not boolean.
    create = function (rectT, cw) {
        if (!rectT || typeof cw !== "boolean") {
            return false;
        }

        var newRotation = Object.create(null);

        return Object.defineProperties(newRotation, {
            isEqualTo: {value: function (rotation) {
                return (newRotation.rectT.isEqualTo(rotation.rectT) &&
                        newRotation.cw === rotation.cw);
            }},

            // rotations of just one tile don't make sense
            makesSense: {get: function () {
                return newRotation.rectT.widthT > 0 ||
                        newRotation.rectT.heightT > 0;
            }},

            direction: {get: function () {
                return newRotation.cw
                    ? -1
                    : 1;
            }},

            angleRad: {get: function () {
                return newRotation.direction * (newRotation.rectT.isSquare
                    ? Math.PI / 2
                    : Math.PI);
            }},

            angleDeg: {get: function () {
                return newRotation.direction * (newRotation.rectT.isSquare
                    ? 90
                    : 180);
            }},

            inverse: {get: function () {
                return create(newRotation.rectT, !newRotation.cw);
            }},

            rectT: {get: function () {
                return rectT;
            }, enumerable: true},

            // direction (true: clock wise)
            cw: {get: function () {
                return cw;
            }, enumerable: true}
        });
    };

    return Object.create(null, {
        create: {value: create}
    });
});
