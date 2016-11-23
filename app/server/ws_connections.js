// Copyright 2016 Felix E. Klee <felix.klee@inka.de>
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

/*jslint node: true, maxlen: 80, es6: true */

"use strict";

var WebSocketServer = require("websocket").server;
var connectionSet = new Set();
var callbacks = [];

var interpretMessage = function (connection, message) {
    if (message.type !== "utf8") {
        return;
    }

    var data = JSON.parse(message.utf8Data);
    var callback = callbacks[data.eventName];
    if (callback !== undefined) {
        callback({
            wsConnection: connection,
            eventData: data.eventData
        });
    }
};

var onNewConnection = function (connection) {
    connectionSet.add(connection);

    connection.on("message", function (message) {
        interpretMessage(connection, message);
    });

    connection.on("close", function () {
        console.log("WebSocket connection closed");
        connectionSet.delete(connection);
    });
};

var startServer = function (httpServer) {
    var wsServer = new WebSocketServer({
        httpServer: httpServer,
        autoAcceptConnections: false
    });

    wsServer.on("request", function (request) {
        var connection = request.accept(null, request.origin);
        console.log("WebSocket connection accepted");
        onNewConnection(connection);
    });
};

var addListener = function (listener) {
    callbacks[listener.eventName] = listener.callback;
};

var broadCast = function (callback) {
    connectionSet.forEach(callback);
};

module.exports = Object.create(null, {
    startServer: {value: startServer},
    addListener: {value: addListener},
    broadCast: {value: broadCast}
});
