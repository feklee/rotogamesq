// Describes the current state of the boards.

/*jslint browser: true, maxlen: 80 */

/*global define */

define([
    "boards_sprites", "board_factory", "../common/config"
], function (
    boardsSprites,
    boardFactory,
    config
) {
    "use strict";

    var selectedI = 0;
    var object;

    var createBoards = function () {
        config.boards.forEach(function (boardConfig) {
            var sideLenT = boardConfig.sideLenT;
            var startTiles = boardsSprites.tiles(boardConfig.startPosT,
                    sideLenT);
            var endTiles = boardsSprites.tiles(boardConfig.endPosT,
                    sideLenT);

            object.push(boardFactory.create(
                boardConfig.name,
                startTiles,
                endTiles
            ));
        });
    };

    object = Object.create([], {
        load: {value: function (onLoaded) {
            boardsSprites.load(function () {
                createBoards();
                onLoaded();
            });
        }},

        selected: {get: function () {
            return object[selectedI];
        }},

        selectedI: {
            get: function () {
                return selectedI;
            },
            set: function (newSelectedI) {
                selectedI = newSelectedI;
            }
        }
    });

    return object;
});
