// Loads boards.

/*jslint node: true, maxlen: 80 */

"use strict";

var boardFactory = require("./board_factory");
var boardsSprites = require("./boards_sprites");
var config = require("../common/config");
var hiscores = require("./hiscores");
var boards;

var createBoards = function () {
    config.boards.forEach(function (boardConfig) {
        var sideLenT = boardConfig.sideLenT;
        var startTiles = boardsSprites.tiles(
            boardConfig.startPosT,
            sideLenT
        );
        var endTiles = boardsSprites.tiles(
            boardConfig.endPosT,
            sideLenT
        );

        var board = boardFactory.create(
            boardConfig.name,
            startTiles,
            endTiles
        );
        hiscores.add(board);
        boards.push(board);
    });
};

boards = Object.create([], {
    load: {value: function (onLoaded) {
        boardsSprites.load(function () {
            createBoards();
            onLoaded();
        });
    }}
});

module.exports = boards;
