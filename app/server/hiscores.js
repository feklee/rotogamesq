// Sets up lists of top players for each board.

/*jslint node: true, maxlen: 80 */

"use strict";

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
    interpretMessage,
    maxNameLen = 8;
var wsConnections = require("./ws_connections");

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

var broadcastUpdatedHiscores = function (board) {
    wsConnections.broadCast(function (wsConnection) {
        emit(wsConnection, board);
    });
};

// Called on client (browser) submitting new hiscore.
onHiscoreForBoard = function (board, hiscore) {
    if (hiscoreIsValid(hiscore, board)) {
        insertHiscore(hiscore, board); // insert command is automatically
                                       // queued in case Redis is down
        broadcastUpdatedHiscores(board);
    } else {
        console.log('Invalid hiscore received');
    }
};

// Called on client wanting updated hiscores.
onRequestOfHiscoresForBoard = function (wsConnection, board) {
    emit(wsConnection, board);
};

// Called on (re-)connect to Redis. Hiscores need to be sent again, so that
// the client doesn't miss possible updates.
onRedisConnect = function (board) {
    wsConnections.broadCast(function (wsConnection) {
        emit(wsConnection, board);
    });
};

// Emits hiscores for the specified board, via WebSocket.
emit = function (wsConnection, board) {
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

        wsConnection.sendUTF(JSON.stringify({
            eventName: "hiscores for " + board.name,
            eventData: hiscores
        }));
    };

    redisClient.ZRANGE(
        board.name,
        0,
        6,
        'WITHSCORES',
        onZrangeDone
    );
};

var add = function (board) {
    wsConnections.addListener({
        eventName: "hiscore for " + board.name,
        callback: function (o) {
            var hiscore = o.eventData;
            onHiscoreForBoard(board, hiscore);
        }
    });
    wsConnections.addListener({
        eventName: "request of hiscores for " + board.name,
        callback: function (o) {
            onRequestOfHiscoresForBoard(o.wsConnection, board);
        }
    });
    redisClient.on("connect", function () {
        onRedisConnect(board);
    });
};

module.exports = Object.create(null, {
    add: {value: add}
});
