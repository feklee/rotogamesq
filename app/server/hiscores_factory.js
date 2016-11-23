// Creates lists of top players, associated with a certain board.

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

var redis = require('redis'),
    redisClient = require('./redis_client'),
    fs = require('fs'),
    insertHiscoreScript,
    create,
    load,
    listen,
    emit,
    hiscoreIsValid,
    redisScore,
    nRotationsFromRedisScore,
    insertHiscore,
    onHiscoreForBoard,
    onRequestOfHiscoresForBoard,
    onRedisConnect,
    onDisconnect,
    interpretMessage,
    maxNameLen = 8;

/*jslint stupid: true */
insertHiscoreScript = fs.readFileSync(__dirname + '/insert_hiscore.lua',
                                      'utf8');
/*jslint stupid: false */

// Verfifies that the hiscores entry is valid by checking if the rotations
// solve the board. This prevents cheating by sending forged data to the
// server.
//
// Also verifies that the name is non-empty.
hiscoreIsValid = function (hiscore, board) {
    var rotations = hiscore.rotations,
        nRotations = hiscore.nRotations,
        name = hiscore.name,
        nameIsValid = (name && typeof name === 'string' && name !== ''),
        rotationsAreValid = (board && board.isSolvedBy(rotations) &&
                             nRotations === rotations.length);

    return nameIsValid && rotationsAreValid;
};

// Score for use with Redis sorted list. This score is assembled from the
// number of rotations and the current time stamp. Thereby it is made easy to
// show newer entries first.
redisScore = function (nRotations) {
    var x = Math.pow(2, 46), // maximum number so that timestamp can be stored
                             // in double precision fractional part without
                             // rounding error (up to 99 as integer part)
        timeStamp = Date.now(),
        fraction = 1 - timeStamp / x; // higher date is preferred

    if (fraction < 0) {
        // as of 2012, this should not happen any time soon...
        console.error('Score overflow');
        return false;
    } else {
        return nRotations + fraction;
    }
};

// See `redisScore`.
nRotationsFromRedisScore = function (redisScore) {
    return Math.floor(redisScore);
};

// Insert the hiscore into the hiscores for the specified board, if it is good
// enough. Fails silently on error.
insertHiscore = function (hiscore, board) {
    var score = redisScore(hiscore.nRotations),
        hiscoreName = hiscore.name.toString().trim().substring(0, maxNameLen);

    if (score === false) {
        return;
    }

    try {
        redisClient.EVAL(
            insertHiscoreScript,
            1,
            board.name,
            score,
            hiscoreName,
            JSON.stringify(hiscore.rotations),
            function (err) {
                if (err) {
                    console.error(err);
                    // no further consequences
                }
            }
        );
    } catch (err) { // just in case some bad data is not handled correctly
        return;
    }
};

// Called on client (browser) submitting new hiscore.
onHiscoreForBoard = function (wsBrowserConnection, board, hiscore) {
    if (hiscoreIsValid(hiscore, board)) {
        insertHiscore(hiscore, board); // insert command is automatically
                                       // queued in case Redis is down

/* TODO
        // Sends updated hiscores:
        emit.call(this, socket, board); // current client
        emit.call(this, socket.broadcast, board); // all other clients
*/
    } else {
        console.log('Invalid hiscore received');
    }
};

// Called on client wanting updated hiscores.
onRequestOfHiscoresForBoard = function (wsBrowserConnection, board) {
    emit.call(this, wsBrowserConnection, board);
};

// Called on (re-)connect to Redis. Hiscores need to be sent again, so that
// the client doesn't miss possible updates.
onRedisConnect = function (wsBrowserConnection, board) {
    emit.call(this, wsBrowserConnection, board);
};

// Called when the client (browser) disconnects. Cleans up.
onDisconnect = function () {
    redisClient.removeListener('connect', onRedisConnect);
};

interpretMessage = function (message, wsBrowserConnection, board) {
    if (message.type !== "utf8") {
        return;
    }

    console.log(message.utf8Data); // TODO

    var data = JSON.parse(message.utf8Data);
    var hiscore;

    switch (data[0]) {
    case "hiscore for " + board.name:
        hiscore = data[1];
        onHiscoreForBoard.call(this, wsBrowserConnection, board, hiscore);
        console.log(board, hiscore); // TODO
        break;
    case "request of hiscores for " + board.name:
        onRequestOfHiscoresForBoard.call(this, wsBrowserConnection, board);
        break;
    }
};

// Using WebSocket, establishes interchange of hiscores between the server and
// a client (browser).
listen = function (wsBrowserConnection, board) {
    wsBrowserConnection.on("message", function (message) {
        interpretMessage.call(this, message, wsBrowserConnection, board);
    });

    redisClient.on("connect", function () {
        onRedisConnect.call(this, wsBrowserConnection, board);
    });

/* TODO:
    socket.once('disconnect', function () {
        onDisconnect.call(this, wsBrowserConnection, board);
    });
*/

    // Sends current hiscores to client. If the client (browser) is just
    // initializing itself and has not set up listeners for getting hiscores,
    // then the hiscores will get lost. However, if the client is reconnecting
    // (e.g. after a temporary loss of network connection on a mobile device),
    // then it will get the latest hiscores, which is good.
// TODO:    emit.call(this, socket, board);
};

// Emits hiscores for the specified board, via Socket.IO.
emit = function (wsBrowserConnection, board) {
    var onZrangeDone = function (err, namesAndScores) {
        var hiscores = [], i, name, score, nRotations;

        if (err) {
            console.error(err);
            return;
        }

        for (i = 0; i < namesAndScores.length; i += 2) {
            name = namesAndScores[i];
            score = parseFloat(namesAndScores[i + 1]);
            nRotations = nRotationsFromRedisScore(score);
            hiscores.push({
                name: name,
                nRotations: nRotations
            });
        }

        wsBrowserConnection.sendUTF(JSON.stringify([
            "hiscores for " + board.name,
            hiscores
        ]));
    };

    redisClient.ZRANGE(
        board.name,
        0,
        6,
        'WITHSCORES',
        onZrangeDone
    );
};

// Creates hiscores object.
create = function () {
    return Object.create(null, {
        listen: {value: function (wsBrowserConnection, board) {
            listen.call(this, wsBrowserConnection, board);
        }}
    });
};

module.exports = Object.create(null, {
    create: {value: create}
});
