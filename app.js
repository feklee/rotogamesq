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

/*jslint node: true, maxerr: 50, maxlen: 79, nomen: true, unparam: true */

'use strict';

var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    boards = require('./app/server/boards'),
    path = require('path'),
    io = require('socket.io').listen(server),
    startServer,
    loadBoardsAndStartServer;

startServer = function () {
    server.listen(app.get('port'), function () {
        console.log('Express server listening on port %d in %s mode',
                    app.get('port'), app.settings.env);
    });

    io.sockets.on('connection', function (socket) {
        boards.emitHiscores(socket);
        boards.listen(socket);
    });
};

loadBoardsAndStartServer = function () {
    boards.load(startServer);
};

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.compress());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express['static'](__dirname + '/public'));

app.get('/', function (req, res) {
    res.render('index', {env: app.get('env')});
});

app.get('/install_webapp', function (req, res) {
    res.render('install_webapp');
});

io.set('log level', 1);

if (app.get('env') === 'development') {
    app.use('/app', express['static'](__dirname + '/app'));
    app.use(express.errorHandler());
    loadBoardsAndStartServer();
} else {
    app.use('/app.build', express['static'](__dirname + '/app.build'));
    require('./app/server/optimize')(loadBoardsAndStartServer);
}