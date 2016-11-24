// Sets up lists of top players for each board.

/*jslint node: true, maxlen: 80 */

"use strict";

var redisClient = require("./redis_client");
var fs = require("fs");
var maxNameLen = 8;
var wsConnections = require("./ws_connections");

var insertHiscoreScript = fs.readFileSync(
    __dirname + "/insert_hiscore.lua",
    "utf8"
);

// Verfifies that the hiscores entry is valid by checking if the rotations
// solve the board. This prevents cheating by sending forged data to the
// server.
//
// Also verifies that the name is non-empty.
var hiscoreIsValid = function (hiscore, board) {
    var rotations = hiscore.rotations;
    var nRotations = hiscore.nRotations;
    var name = hiscore.name;
    var nameIsValid = (name && typeof name === "string" && name !== "");
    var rotationsAreValid = (board &&
            board.isSolvedBy(rotations) &&
            nRotations === rotations.length);

    return nameIsValid && rotationsAreValid;
};

// Score for use with Redis sorted list. This score is assembled from the
// number of rotations and the current time stamp. Thereby it is made easy to
// show newer entries first.
var redisScore = function (nRotations) {
    var x = Math.pow(2, 46); // maximum number so that timestamp can be stored
                             // in double precision fractional part without
                             // rounding error (up to 99 as integer part)
    var timeStamp = Date.now();
    var fraction = 1 - timeStamp / x; // higher date is preferred

    if (fraction < 0) {
        // as of 2012, this should not happen any time soon...
        console.error("Score overflow");
        return false;
    } else {
        return nRotations + fraction;
    }
};

// See `redisScore`.
var nRotationsFromRedisScore = function (redisScore) {
    return Math.floor(redisScore);
};

// Insert the hiscore into the hiscores for the specified board, if it is good
// enough. Fails silently on error.
var insertHiscore = function (hiscore, board) {
    var score = redisScore(hiscore.nRotations);
    var hiscoreName = hiscore.name.toString().trim().substring(0, maxNameLen);

    if (score === false) {
        return;
    }

    try {
        var evaluate = redisClient.EVAL;
        evaluate.call(
            redisClient,
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
    } catch (ignore) { // just in case some bad data is not handled correctly
        return;
    }
};

var parseNamesAndScores = function (namesAndScores) {
    var name;
    var score;
    var nRotations;
    var hiscores = [];

    var i = 0;
    while (i < namesAndScores.length) {
        name = namesAndScores[i];
        score = parseFloat(namesAndScores[i + 1]);
        nRotations = nRotationsFromRedisScore(score);
        hiscores.push({
            name: name,
            nRotations: nRotations
        });
        i += 2;
    }

    return hiscores;
};

// Emits hiscores for the specified board, via WebSocket.
var emit = function (wsConnection, board) {
    var onZrangeDone = function (err, namesAndScores) {
        if (err) {
            console.error(err);
            return;
        }

        var hiscores = parseNamesAndScores(namesAndScores);

        wsConnection.sendUTF(JSON.stringify({
            eventName: "hiscores for " + board.name,
            eventData: hiscores
        }));
    };

    var zrange = redisClient.ZRANGE;
    zrange.call(
        redisClient,
        board.name,
        0,
        6,
        "WITHSCORES",
        onZrangeDone
    );
};

var broadcastUpdatedHiscores = function (board) {
    wsConnections.broadCast(function (wsConnection) {
        emit(wsConnection, board);
    });
};

// Called on client (browser) submitting new hiscore.
var onHiscoreForBoard = function (board, hiscore) {
    if (hiscoreIsValid(hiscore, board)) {
        insertHiscore(hiscore, board); // insert command is automatically
                                       // queued in case Redis is down
        broadcastUpdatedHiscores(board);
    } else {
        console.log("Invalid hiscore received");
    }
};

// Called on client wanting updated hiscores.
var onRequestOfHiscoresForBoard = function (wsConnection, board) {
    emit(wsConnection, board);
};

// Called on (re-)connect to Redis. Hiscores need to be sent again, so that
// the client doesn't miss possible updates.
var onRedisConnect = function (board) {
    wsConnections.broadCast(function (wsConnection) {
        emit(wsConnection, board);
    });
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
