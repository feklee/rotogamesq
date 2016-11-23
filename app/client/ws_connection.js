// For interfacing via WebSocket.

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
