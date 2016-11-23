// Loads boards.

/*jslint node: true, maxlen: 80 */

'use strict';

var boardFactory = require('./board_factory'),
    boardsSprites = require('./boards_sprites'),
    config = require('../common/config'),
    createBoards,
    boards;
var hiscores = require('./hiscores');

createBoards = function () {
    config.boards.forEach(function (boardConfig) {
        var sideLenT = boardConfig.sideLenT,
            startTiles = boardsSprites.tiles(boardConfig.startPosT,
                                             sideLenT),
            endTiles = boardsSprites.tiles(boardConfig.endPosT,
                                           sideLenT);

        var board = boardFactory.create(boardConfig.name,
                                        startTiles, endTiles);
        hiscores.add(board);
        boards.push(board);
    });
};

boards = Object.create([], {
    load: {value: function (onLoaded) {
        boardsSprites.load(function () {
            createBoards.call(boards);
            onLoaded();
        });
    }},
});

module.exports = boards;
