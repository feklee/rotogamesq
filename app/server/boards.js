// Loads boards.

// Copyright 2012 Felix E. Klee <felix.klee@inka.de>
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

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
