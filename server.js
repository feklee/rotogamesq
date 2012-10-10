// Serves the game and assets.

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

var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    boards = require('./server/boards_factory').load(),
    path = require('path'),
    io = require('socket.io').listen(server);

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');

    app.use(express.compress());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express['static'](__dirname + '/public'));
    app.use('/client', express['static'](__dirname + '/client'));
    app.use('/boards', express['static'](__dirname + '/boards'));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

app.get('/', function (req, res) {
    res.render('index');
});

server.listen(app.get('port'), function () {
    console.log('Express server listening on port %d in %s mode',
                app.get('port'), app.settings.env);
});

io.configure('development', function () {
    io.set('log level', 1);
});

io.sockets.on('connection', function (socket) {
    socket.on('hiscore proposal', function (proposal) {
        console.log('hiscore proposal', proposal);
    });

    boards.forEach(function (board) {
        board.emitHiscores(socket);
    });
});
