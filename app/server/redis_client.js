// Client for communicating with Redis.
//
// The client tries to (re-)connect:
//
//   * every time a command is sent,
//
//   * automatically and repeatedly (as of `node_redis` v0.8 at exponentially
//     increasing time intervals).

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

var port = process.env.REDIS_PORT || 6379,
    host = process.env.REDIS_HOST || '127.0.0.1',
    password = process.env.REDIS_PASSWORD,
    redisClient = require('redis').createClient(port, host);

if (password) {
    redisClient.auth(password);
}

redisClient.on('error', function (err) {
    console.error('Redis client:', err);
});

// Disables check for max listeners, because potentially a lot may be created
// (to listen to "connect", for example). See also the 2012-11-15 CET thread
// "High number of event handlers problematic?" in the mailing list
// <nodejs@googlegroups.com>.
redisClient.setMaxListeners(0);

module.exports = redisClient;
