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
    routes = require('./routes/create')(app.get('env')),
    io = require('socket.io').listen(server),
    startServer,
    loadBoardsAndStartServer;

startServer = function () {
    server.listen(app.get('port'), function () {
        console.log('Express server listening on port %d in %s mode',
                    app.get('port'), app.settings.env);
    });

    // also triggered on reconnection
    io.sockets.on('connection', function (socket) {
        boards.listen(socket);
        console.log(process.memoryUsage()); // fixme: remove
        console.log('fixme: connect');
        socket.on('disconnect', function () {
            console.log('fixme: disconnect');
        });
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

app.get('/', routes.index);
app.get('/install-webapp', routes.installWebapp);
app.get('/manifest.appcache', routes.manifestAppcache);

io.set('log level', 1);

if (app.get('env') === 'development') {
    app.use('/app', express['static'](__dirname + '/app'));
    app.use(express.errorHandler());
    loadBoardsAndStartServer();
} else { // production
    // advised production settings from Socket.IO wiki (as of Oct. 2012), but
    // without Flash transport (can cause issues with Joyent -
    // <http://blog.dreamflashstudio.com/2012/08/nodejitsu-on-joyent/>):
    io.enable('browser client minification');
    io.enable('browser client etag');
    io.enable('browser client gzip');
    io.set('transports', ['websocket', 'htmlfile', 'xhr-polling',
                          'jsonp-polling']);

    app.use('/app.build', express['static'](__dirname + '/app.build'));
    require('./app/server/optimize')(loadBoardsAndStartServer);
}
