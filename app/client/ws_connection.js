// For interfacing via WebSocket.

/*jslint browser: true, maxlen: 80, es6 */

/*global define, window */

define(function () {
    "use strict";

    var callbacks = {};
    var onOpenCallbacks = [];
    var webSocket;
    const retryDelay = 2000; // ms

    var url = function () {
        var l = window.location;
        var protocol = l.protocol === "https"
            ? "wss"
            : "ws";
        return protocol + "://" + l.host;
    };

    var onMessage = function (message) {
        var data;
        var json;
        if (typeof message.data === "string") {
            json = message.data;
            data = JSON.parse(json);
            var callback = callbacks[data.eventName];
            if (callback !== undefined) {
                callback(data.eventData);
            }
        } else {
            return;
        }
    };

    var onOpen = function () {
        onOpenCallbacks.forEach(function (callback) {
            callback();
        });
    };

    var connect;

    var onClose = function () {
        setTimeout(connect, retryDelay);
    };

    connect = function () {
        webSocket = new window.WebSocket(url());
        webSocket.onmessage = onMessage;
        webSocket.onopen = onOpen;
        webSocket.onclose = onClose;
    };

    var addListener = function (listener) {
        callbacks[listener.eventName] = listener.callback;
    };

    var addOnOpenCallback = function (callback) {
        onOpenCallbacks.push(callback);
    };

    var emit;

    var emitAfterDelay = function (data) {
        setTimeout(function () {
            emit(data);
        }, retryDelay);
    };

    emit = function (data) {
        if (webSocket.readyState !== webSocket.OPEN) {
            emitAfterDelay(data);
            return;
        }

        try {
            webSocket.send(JSON.stringify(data));
        } catch (ignore) {
        }
    };

    connect();

    return Object.create(null, {
        addListener: {value: addListener},
        emit: {value: emit},
        addOnOpenCallback: {value: addOnOpenCallback}
    });
});
