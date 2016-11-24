// Creates rectangles in coordinates of tiles.

/*jslint browser: true, maxlen: 80 */

/*global define, require, module */

var commonDefine;
try {
    commonDefine = define;
} catch (ignore) {
    commonDefine = require("amdefine")(module);
}

commonDefine(function () {
    "use strict";

    var isValidPosT = function (posT) {
        return (Array.isArray(posT) &&
                posT.length === 2 &&
                typeof posT[0] === "number" &&
                typeof posT[1] === "number");
    };

    var areSamePosT = function (pos1T, pos2T) {
        return pos1T[0] === pos2T[0] && pos1T[1] === pos2T[1];
    };

    return Object.create(null, {
        // Creates rectangle from top-left and bottom-right corners. If data is
        // invalid, then returns false.
        create: {value: function (tlPosT, brPosT) {
            var newRectT;

            if (!isValidPosT(tlPosT) || !isValidPosT(brPosT)) {
                return false;
            }

            newRectT = Object.create([]);
            newRectT.push(tlPosT);
            newRectT.push(brPosT);

            return Object.defineProperties(newRectT, {
                isEqualTo: {value: function (rectT) {
                    return (areSamePosT(newRectT[0], rectT[0]) &&
                            areSamePosT(newRectT[1], rectT[1]));
                }},
                widthT: {get: function () {
                    return newRectT[1][0] - newRectT[0][0];
                }},
                heightT: {get: function () {
                    return newRectT[1][1] - newRectT[0][1];
                }},
                centerT: {get: function () {
                    return [(newRectT[0][0] + newRectT[1][0]) / 2,
                            (newRectT[0][1] + newRectT[1][1]) / 2];
                }},
                contains: {value: function (posT) {
                    var xT = posT[0];
                    var yT = posT[1];
                    return (xT >= newRectT[0][0] && yT >= newRectT[0][1] &&
                            xT <= newRectT[1][0] && yT <= newRectT[1][1]);
                }},
                isSquare: {get: function () {
                    return newRectT.widthT === newRectT.heightT;
                }}
            });
        }}
    });
});
