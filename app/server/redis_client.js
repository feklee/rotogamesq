// Client for communicating with Redis.
//
// The client tries to (re-)connect:
//
//   * every time a command is sent,
//
//   * automatically and repeatedly (as of `node_redis` v0.8 at exponentially
//     increasing time intervals).

/*jslint node: true, maxlen: 80 */

'use strict';

var port = process.env.REDIS_PORT || 6379,
    host = process.env.REDIS_HOST || '127.0.0.1',
    password = process.env.REDIS_PASSWORD,
    redisClient = require('redis').createClient(port, host);

redisClient.retry_backoff = 1; // disables backoff
redisClient.retry_delay = 500; // ms
redisClient.debug_mode = true;

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
