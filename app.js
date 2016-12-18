// Serves the game and assets.

/*jslint node: true, maxlen: 80 */

"use strict";

var express = require("express");
var app = express();
var httpServer = require("http").createServer(app);
var wsConnections = require("./app/server/ws_connections");
var boards = require("./app/server/boards");
var routes = require("./routes/create")(app.get("env"));
var startHttpServer;
var loadBoardsAndStartServer;

startHttpServer = function () {
    httpServer.listen(app.get("port"), function () {
        console.log("Express server listening on port %d in %s mode",
                app.get("port"), app.settings.env);
    });

    wsConnections.startServer(httpServer);
};

loadBoardsAndStartServer = function () {
    boards.load(startHttpServer);
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
