// For interfacing via Socket.IO.

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

/*jslint browser: true, maxerr: 50, maxlen: 79 */

/*global define, io */

define(function () {
    'use strict';

    var socket;

    function host() {
        var src = document.getElementById('socketIoScript').src,
            matches = src.match(/https?:\/\/[a-zA-Z0-9-.]*/);

        return matches.length >= 1 ? matches[0] : '';
    }

    function connect(onConnect) {
        if (socket === undefined) {
            socket = io.connect(host());
        }

        if (socket.socket.connected) {
            onConnect();
        } else {
            socket.on('connect', onConnect);
        }
    }

    return Object.create(null, {
        // Establishes connection if not yet done.
        emit: {value: function () {
            var emitArguments = arguments;
            connect(function () {
                socket.emit.apply(socket, emitArguments);
            });
        }}
    });
});
