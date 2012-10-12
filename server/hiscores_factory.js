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

/*jslint node: true, maxerr: 50, maxlen: 79, nomen: true */

'use strict';

var redis = require('redis'),
    redisClient = require('./redis_client'),
    fs = require('fs'),
    insertHiscoreScript = fs.readFileSync(__dirname + '/insert_hiscore.lua',
                                          'utf8'),
    hiscoresScript = fs.readFileSync(__dirname + '/hiscores.lua', 'utf8'),
    create,
    load,
    listen,
    emit,
    hiscoreIsValid,
    redisScore,
    nRotationsFromRedisScore,
    insertHiscore;

// Verfifies that the hiscores entry is valid by checking if the rotations
// solve the board. This prevents cheating by sending forged data to the
// server.
//
// Also verifies that the name is non-empty.
hiscoreIsValid = function (hiscore) {
    // fixme: implement check that rotations can be done

    return (hiscore.nRotations === hiscore.rotations.length &&
            hiscore.name !== '');
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
        console.log('Error: overflow');
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
insertHiscore = function (hiscore, boardName) {
    var score = redisScore(hiscore.nRotations);

    if (score === false) {
        return;
    }

    /*jslint evil: true */
    redisClient['eval'](
        insertHiscoreScript,
        1,
        boardName.toString(), // in case board name is e.g. 1337
        score,
        hiscore.name.toString(),
        function (err, res) {
            // fixme
            console.dir(err);
            console.dir(res);
        }
    );
    /*jslint evil: false */

    // fixme: trim

    // fixme: perhaps use sorted sets, with composed score:
    //   http://en.wikipedia.org/wiki/Binary64
    // fixme: perhaps use as keys in hash:
    //   score (2digits) + name
    //   This avoids overwriting a hash, e.g. with one where
    //   the score is lower. Only problem: Duplicates (same
    //   name with different scores, but perhaps avoid that
    //   by using the name only in the sorted set). Or: just
    //   filter when reading out.
    // fixme: Perhaps trim to 7×7
    //
    // Perhaps update in transaction, and keep data in sorted list
    // only.
};

listen = function (socket, boardName) {
    console.error('fixme1');
    socket.on('hiscore for ' + boardName, function (hiscore) {
        console.warn('fixme2');

        if (hiscoreIsValid(hiscore)) {
            insertHiscore(hiscore, boardName);
            emit.call(this, socket, boardName);
        }
    });
};

// Emits hiscores for the specified board, via Socket.IO.
emit = function (socket, boardName) {
    var onEvalDone = function (err, namesWithRedisScore) {
        var hiscores = [];

        if (err) {
            console.log(err);
            return;
        }

        namesWithRedisScore.forEach(function (nameWithScore) {
            console.warn('fixme0_' + boardName, nameWithScore); //fixme
            if (nameWithScore) { // fixme: perhaps remove this `if`
                var name = nameWithScore[0],
                    score = nameWithScore[1],
                    nRotations = nRotationsFromRedisScore(score);
                hiscores.push({
                    name: name,
                    nRotations: nRotations
                });
            }
        });

        socket.emit('hiscores for ' + boardName, hiscores);
    };

    /*jslint evil: true */
    redisClient['eval'](
        hiscoresScript,
        1,
        boardName.toString(), // in case board name is numeric
        onEvalDone
    );
    /*jslint evil: false */
};

create = function (boardName) {
    return Object.create(null, {
        listen: {value: function (socket) {
            listen.call(this, socket, boardName);
        }},

        emit: {value: function (socket) {
            emit.call(this, socket, boardName);
        }}
    });
};

module.exports = Object.create(null, {
    create: {value: create}
});
