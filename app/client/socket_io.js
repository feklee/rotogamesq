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

    var host, on, socketNamespace, checkInterval, repeatedlyCheckConnection;

    host = function () {
        var l = window.location;
        return l.protocol + '//' + l.host;
    };

    on = function () {
        socketNamespace.on.apply(socketNamespace, arguments);
    };

    // There is no callback for waiting until the connection is established:
    // `socket.emit` can be called right right away as events will be queued.
    socketNamespace = io.connect(host(), {
        'reconnection limit': 20000, // ms
        'max reconnection attempts': Infinity
    });

    return Object.create(null, {
        // Emits the specified event. If there currently is no connection, then
        // the event is queued. See also:
        //
        // https://groups.google.com/d/topic/socket_io/3bSl7RP8lpI/discussion
        emit: {value: function () {
            var emitArguments = arguments;
            socketNamespace.emit.apply(socketNamespace, emitArguments);
        }},

        on: {value: on}
    });
});
