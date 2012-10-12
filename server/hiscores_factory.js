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
    create,
    load,
    listen,
    emit,
    hiscoreIsValid,
    redisScore;

// Verfifies that the hiscores entry is valid by checking if the rotations
// solve the board. This prevents cheating by sending forged data to the
// server.
hiscoreIsValid = function (hiscore) {
    // fixme: also check that name is non-empty

    return hiscore.nRotations === hiscore.rotations.length; // fixme: implement
};

// Score for use with Redis sorted list. This score is assembled from the
// number of rotations and the current time stamp. Thereby it is made easy to
// show newer entries first.
redisScore = function (nRotations) {
    var x = Math.pow(2, 46), // maximum number so that timestamp can be stored
                             // in double precision fractional part without
                             // rounding error (up to 99 as integer part)
        timeStamp = Date.now();
    return nRotations + timeStamp / x;
};

listen = function (socket, boardName) {
    console.error('fixme1');
    socket.on('hiscore for ' + boardName, function (hiscore) {
        console.warn('fixme2');

        var listKey = boardName.toString(); // use always string, even if board
                                            // name is a number

        if (!hiscoreIsValid(hiscore)) {
            return;
        }

        try { // `try` prevents server from going down on bad input
            redisClient.zadd(listKey,
                             redisScore(hiscore.nRotations),
                             hiscore.name);

            // fixme: re-emit

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
        } catch (err) {
            console.log(err);
        }
    });
};

emit = function (socket, boardName) {
    socket.emit('hiscores for ' + boardName, [
        {
            name: 'Roger W.',
            nRotations: 8
        },
        {
            name: 'Felix',
            nRotations: 10
        },
        {
            name: 'Mario',
            nRotations: 10
        }
    ]);
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
