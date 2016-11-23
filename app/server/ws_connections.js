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
