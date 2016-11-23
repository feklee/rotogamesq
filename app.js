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

/*jslint node: true, maxlen: 80 */

"use strict";

var express = require("express");
var app = express();
var server = require("http").createServer(app);
var boards = require("./app/server/boards");
var routes = require("./routes/create")(app.get("env"));
var WebSocketServer = require("websocket").server;
var startServer;
var loadBoardsAndStartServer;

startServer = function () {
    server.listen(app.get("port"), function () {
        console.log("Express server listening on port %d in %s mode",
                app.get("port"), app.settings.env);
    });

    // also triggered on reconnection
    var wsServer = new WebSocketServer({
        httpServer: server,
        autoAcceptConnections: false
    });

    wsServer.on("request", function (request) {
        var wsBrowserConnection = request.accept(null, request.origin);
        console.log("Connection from browser accepted");

        boards.listen(wsBrowserConnection);

        wsBrowserConnection.on("message", function (message) {
            if (message.type === "utf8") {
                console.log(message.utf8Data);
            }
        });
    });
};

loadBoardsAndStartServer = function () {
    boards.load(startServer);
};

app.set("port", process.env.PORT || 3000);
app.set("views", __dirname + "/views");
app.set("view engine", "jade");

app.use(express.compress());
app.use(express.logger("dev"));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(__dirname + "/public"));

app.get("/", routes.index);
app.get("/install-webapp", routes.installWebapp);
app.get("/manifest.appcache", routes.manifestAppcache);
app.get("/manifest.webapp", routes.manifestWebapp);
app.get("/web-app-manifest.json", routes.webAppManifestJson);

if (app.get("env") === "development") {
    app.use("/app", express.static(__dirname + "/app"));
    app.use(express.errorHandler());
    loadBoardsAndStartServer();
} else { // production
    app.use("/app.build", express.static(__dirname + "/app.build"));
    require("./app/server/optimize")(loadBoardsAndStartServer);
}
