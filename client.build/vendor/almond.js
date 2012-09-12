(function () {
/**
 * almond 0.1.4 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        aps = [].slice;

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (waiting.hasOwnProperty(name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!defined.hasOwnProperty(name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    function makeMap(name, relName) {
        var prefix, plugin,
            index = name.indexOf('!');

        if (index !== -1) {
            prefix = normalize(name.slice(0, index), relName);
            name = name.slice(index + 1);
            plugin = callDep(prefix);

            //Normalize according
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            p: plugin
        };
    }

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = makeRequire(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = defined[name] = {};
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = {
                        id: name,
                        uri: '',
                        exports: defined[name],
                        config: makeConfig(name)
                    };
                } else if (defined.hasOwnProperty(depName) || waiting.hasOwnProperty(depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else if (!defining[depName]) {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        waiting[name] = [name, deps, callback];
    };

    define.amd = {
        jQuery: true
    };
}());

define("vendor/almond",[], function(){});

// Creates tiles objects describing the status of a board.

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

/*global define */

define('tiles_factory',[],function () {
    

    var prototype;

    // Returns the specified triple as RGB string.
    function rgb(imgData, offs) {
        return ('rgb(' +
                imgData[offs] + ',' +
                imgData[offs + 1] + ',' +
                imgData[offs + 2] + ')');
    }

    // Reads the color values of the image into a two dimensional array of hex
    // values. Ignores the alpha channel.
    //
    // Tile colors are stored in objects and not directly as value of a tile.
    // This makes it possible to differentiate between tiles that have the same
    // color (when comparing them using e.g. `===`).
    function tilesFromCtx(ctx, width, height) {
        var tiles, tilesColumn, xT, yT, triple, offs,
            sideLenT = Math.min(width, height), // forces square dimensions
            imgData = ctx.getImageData(0, 0, sideLenT, sideLenT).data,
            tileId = 0;

        tiles = Object.create(prototype);
        for (xT = 0; xT < sideLenT; xT += 1) {
            tilesColumn = [];
            for (yT = 0; yT < sideLenT; yT += 1) {
                offs = 4 * (yT * sideLenT + xT);
                tilesColumn.push({
                    color: rgb(imgData, offs)
                });
            }
            tiles.push(tilesColumn);
        }

        return tiles;
    }

    function areEqual(tiles1, tiles2, isEqual) {
        var xT, yT, tiles2Column, tiles1Column;

        if (tiles2.widthT !== tiles1.widthT ||
                tiles2.heightT !== tiles1.heightT) {
            return false;
        }

        for (xT = 0; xT < tiles2.length; xT += 1) {
            tiles2Column = tiles2[xT];
            tiles1Column = tiles1[xT];
            for (yT = 0; yT < tiles2Column.length; yT += 1) {
                if (!isEqual(tiles2Column[yT], tiles1Column[yT])) {
                    return false;
                }
            }
        }

        return true;
    }

    prototype = Object.create([], {
        areEqualTo: {value: function (tiles) {
            return areEqual(this, tiles, function (tile1, tile2) {
                return tile1 === tile2;
            });
        }},

        colorsAreEqualTo: {value: function (tiles) {
            return areEqual(this, tiles, function (tile1, tile2) {
                return tile1.color === tile2.color;
            });
        }},

        widthT: {get: function () {
            return this.length;
        }},

        heightT: {get: function () {
            return this.widthT > 0 ? this[0].length : 0;
        }},

        // Returns a deep copy of `this`.
        copy: {value: function (rectT) {
            var newTiles = Object.create(prototype), xT;

            this.forEach(function (thisColumn) {
                newTiles.push(thisColumn.slice());
            });

            return newTiles;
        }}
    });

    return Object.create(null, {
        // Loads tiles (each identified by a color specifier), describing the
        // layout of a board. The data is read from the specified graphics
        // file.
        load: {value: function (imgUrl, onLoaded) {
            var img = new Image();

            img.onload = function () {
                var tmpCanvas = document.createElement('canvas'),
                    ctx = tmpCanvas.getContext('2d');
                tmpCanvas.width = img.width;
                tmpCanvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                onLoaded(tilesFromCtx(ctx, img.width, img.height));
            };
            img.src = imgUrl;
        }}
    });
});

// Creates lists of top players, associated with a certain board.

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

/*global define */

define('hiscores_factory',[],function () {
    // fixme: remove, if unused

    

    var maxLength = 7,
        fixmeInit = [
            {name: 'Roger', nRotations: 6},
            {name: 'Larry', nRotations: 8},
            {name: 'Zak', nRotations: 9},
            {name: 'Mario', nRotations: 10},
            {name: 'Gianna', nRotations: 11},
            {name: 'Sonya', nRotations: 30},
            {name: 'Johnny', nRotations: 42}
        ].slice(0, maxLength),
        lastNameSet = ''; // last name edited (preset for new proposals)

/*fixme:    function loadJson(url) {
        var req = new XMLHttpRequest();

        req.onreadystatechange = function() {
            if (req.readyState == 4 && req.status != 200) {
                // What you want to do on failure
                alert(req.status + " : " + req.responseText);
            }
            if (req.readyState == 4 && req.status == 200) {
                // What you want to do on success
                onSuccessLogin();
            }
        }

        req.open("GET", url + '?' + Date.now(), true);
    }*/

    function proposalIsBetterOrEqual(proposal, hiscore) {
        return proposal !== null && proposal.nRotations <= hiscore.nRotations;
    }

    function keepHiscoresLengthInBounds(hiscores) {
        hiscores.length = Math.min(hiscores.length, maxLength);
    }

    // Inserts proposal into hiscore:
    //
    //   * if it has sufficiently small number of rotations,
    //
    //   * and if name is not empty,
    //
    //   * and if there are no duplicates (same name) with a lower number of
    //     rotations.
    function insertProposal(hiscores, proposal) {
        var i, hiscore, proposalHasBeenInserted = false;

        if (proposal.name !== '') {
            for (i = 0; i < hiscores.length; i += 1) {
                hiscore = hiscores[i];

                if (proposal.name === hiscore.name &&
                        proposal.nRotations >= hiscore.nRotations) {
                    return; // duplicate with lower/same number of rotations
                }

                if (proposal.nRotations <= hiscore.nRotations &&
                        !proposalHasBeenInserted) {
                    hiscores.splice(i, 0, proposal);
                    proposalHasBeenInserted = true;
                } else if (proposal.name === hiscore.name) {
                    hiscores.splice(i, 1); // duplicate that is not better
                }
            }
        }

        keepHiscoresLengthInBounds(hiscores); // done at the end (in case
                                              // duplicates have been removed)
    }

    return Object.create(null, {
        load: {value: function (hiscoresUrl, onLoaded) {
            var hiscores,
                proposal = null; // new, proposed hiscore (editable)

            // fixme: do XHR here (later perhaps Socket.IO)

            hiscores = fixmeInit.slice();

            onLoaded(Object.create(null, {
                // Calls callback with two parameters: hiscore, index, and
                // whether the hiscore is editable (only appears once)
                forEach: {value: function (callback) {
                    var i, hiscore,
                        maxI = hiscores.length,
                        proposalHasBeenShown = false;

                    for (i = 0; i < maxI; i += 1) {
                        hiscore = hiscores[i];
                        if (proposalIsBetterOrEqual(proposal, hiscore) &&
                                !proposalHasBeenShown) {
                            callback(proposal, i, true);
                            i -= 1; // repeat current hiscore in next run
                            maxI -= 1;
                            proposalHasBeenShown = true;
                        } else {
                            callback(hiscore, i, false);
                        }
                    }
                }},

                maxNameLen: {get: function () {
                    return 8;
                }},

                nameInProposal: {set: function (name) {
                    if (proposal !== null) {
                        name = name.substring(0, this.maxNameLen);
                        proposal.name = name;
                        lastNameSet = name;
                    }
                }},

                saveProposal: {value: function () {
                    // fixme: send to server, or explain here and in README.md
                    // that things are not saved to server.

                    if (proposal !== null) {
                        insertProposal(hiscores, proposal);
                        proposal = null;
                    }
                }},

                // proposes a new hiscore (name is to be entered by the player)
                propose: {value: function (rotations) {
                    proposal = {
                        name: lastNameSet,
                        rotations: rotations.slice(),
                        nRotations: rotations.length
                    };
                }},

                rmProposal: {value: function () {
                    proposal = null;
                }}
            }));
        }}
    });
});

// Creates boards (by loading from URLs).

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

/*global define */

define('board_factory',[
    'tiles_factory', 'hiscores_factory'
], function (tilesFactory, hiscoresFactory) {
    

    var prototype;

    function allResourcesAreLoaded(board) {
        return (board.tiles !== undefined &&
                board.endTiles !== undefined &&
                board.hiscores !== undefined);
    }

    function onAllResourcesLoaded(board, onLoaded) {
        Object.defineProperty(board, 'sideLenT', {value: board.tiles.length});
        onLoaded(board);
    }

    // Start tiles form the *mutable* start layout of blocks, i.e. the current
    // state of the board.
    function onStartTilesLoaded(board, tiles, onLoaded) {
        Object.defineProperty(board, 'tiles', {value: tiles});
        if (allResourcesAreLoaded(board)) {
            onAllResourcesLoaded(board, onLoaded);
        }
    }

    // Start tiles form the *immutable* start layout of blocks, the destination
    // state of the board.
    function onEndTilesLoaded(board, tiles, onLoaded) {
        Object.defineProperty(board, 'endTiles', {value: tiles});
        if (allResourcesAreLoaded(board)) {
            onAllResourcesLoaded(board, onLoaded);
        }
    }

    function onHiscoresLoaded(board, hiscores, onLoaded) {
        Object.defineProperty(board, 'hiscores', {value: hiscores});
        if (allResourcesAreLoaded(board)) {
            onAllResourcesLoaded(board, onLoaded);
        }
    }

    function resourceUrl(name, relativePath) {
        return 'boards/' + name + '/' + relativePath;
    }

    function imgUrl(name, type) {
        return resourceUrl(name, type + '.gif');
    }

    function hiscoresUrl(name, type) {
        return resourceUrl('hiscores.json');
    }

    function selectedTiles(tiles, x1T, y1T, x2T, y2T) {
        var sTiles, sTilesColumn, xT, yT;

        sTiles = [];
        for (xT = x1T; xT <= x2T; xT += 1) {
            sTilesColumn = [];
            for (yT = y1T; yT <= y2T; yT += 1) {
                sTilesColumn.push(tiles[xT][yT]);
            }
            sTiles.push(sTilesColumn);
        }

        return sTiles;
    }

    function rotator90CW(sTiles, xT, yT, widthT, heightT) {
        return sTiles[yT][widthT - xT];
    }

    function rotator90CCW(sTiles, xT, yT, widthT, heightT) {
        return sTiles[heightT - yT][xT];
    }

    function rotator180(sTiles, xT, yT, widthT, heightT) {
        return sTiles[widthT - xT][heightT - yT];
    }

    function rotateTilesWithRotator(tiles, rectT, rotator) {
        var xT, yT,
            x1T = rectT[0][0], y1T = rectT[0][1],
            x2T = rectT[1][0], y2T = rectT[1][1],
            widthT = x2T - x1T,
            heightT = y2T - y1T,
            sTiles = selectedTiles(tiles, x1T, y1T, x2T, y2T);

        for (xT = x1T; xT <= x2T; xT += 1) {
            for (yT = y1T; yT <= y2T; yT += 1) {
                tiles[xT][yT] = rotator(sTiles,
                                        xT - x1T, yT - y1T,
                                        widthT, heightT);
            }
        }
    }

    // Rotates the tiles in the specified rectangle in the specified direction:
    // clockwise if `cw` is true
    //
    // The rectangle is defined by its top left and its bottom right corner, in
    // that order.
    function rotateTiles(tiles, rotation) {
        var rectT = rotation.rectT, cw = rotation.cw;

        if (rectT.isSquare) {
            if (cw) {
                rotateTilesWithRotator(tiles, rectT, rotator90CW);
            } else {
                rotateTilesWithRotator(tiles, rectT, rotator90CCW);
            }
        } else {
            rotateTilesWithRotator(tiles, rectT, rotator180);
        }
    }

    // Applies the inverse of the specified rotation.
    function rotateTilesInverse(tiles, rotation) {
        rotateTiles(tiles, rotation.inverse);
    }

    function updateIsFinished(internal, board, rotation) {
        if (board.tiles.colorsAreEqualTo(board.endTiles)) {
            if (!internal.isFinished) {
                internal.isFinished = true;
                board.hiscores.propose(internal.rotations);
            }
        } else {
            internal.isFinished = false;
            board.hiscores.rmProposal();
        }
    }

    prototype = Object.create(null, {
        rotate: {value: function (internal, rotation) {
            var rectT = rotation.rectT, cw = rotation.cw, tiles = this.tiles;

            internal.rotations.push(rotation);
            internal.futureRotations.length = 0; // resets redo history
            rotateTiles(this.tiles, rotation);
            updateIsFinished(internal, this);
            internal.lastRotation = rotation;
        }},

        undo: {value: function (internal) {
            var rotation = internal.rotations.pop();
            if (rotation !== undefined) {
                internal.futureRotations.push(rotation);
                rotateTilesInverse(this.tiles, rotation);
                updateIsFinished(internal, this);
                internal.lastRotation = rotation.inverse;
            } // else: no more undo
        }},

        redo: {value: function (internal) {
            var rotation = internal.futureRotations.pop();
            if (rotation !== undefined) {
                internal.rotations.push(rotation);
                rotateTiles(this.tiles, rotation);
                updateIsFinished(internal, this);
                internal.lastRotation = rotation;
            } // else: no more redo
        }}
    });

    // Loads the board, and calls `onLoaded(board)` when done.
    function load(name, onLoaded) {
        var board,
            internal = {
                rotations: [], // for undo, for counting, ...
                futureRotations: [], // for redo
                lastRotation: null,
                isFinished: false // true when game is finished
            };

        board = Object.create(prototype, {
            rotate: {value: function (rotation) {
                prototype.rotate.call(this, internal, rotation);
            }},

            nRotations: {get: function () {
                return internal.rotations.length;
            }},

            undoIsPossible: {get: function () {
                return internal.rotations.length > 0;
            }},

            undo: {value: function () {
                prototype.undo.call(this, internal);
            }},

            redoIsPossible: {get: function () {
                return internal.futureRotations.length > 0;
            }},

            redo: {value: function () {
                prototype.redo.call(this, internal);
            }},

            isFinished: {get: function () {
                return internal.isFinished;
            }},

            lastRotation: {get: function () {
                return internal.lastRotation;
            }}
        });

        tilesFactory.load(imgUrl(name, 'start'), function (tiles) {
            onStartTilesLoaded(board, tiles, onLoaded);
        });
        tilesFactory.load(imgUrl(name, 'end'), function (tiles) {
            onEndTilesLoaded(board, tiles, onLoaded);
        });
        hiscoresFactory.load(hiscoresUrl(name), function (hiscores) {
            onHiscoresLoaded(board, hiscores, onLoaded);
        });
    }

    return Object.create(null, {
        'load': {value: load}
    });
});

// Describes the current state of the boards.

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

/*global define */

define('boards',['board_factory'], function (boardFactory) {
    

    var selectedI = 0,
        object,
        boardNames = ['13', 'smiley', 'invaders', 'house', 'dogman', 'rgbcmy'];

    function allBoardsAreLoaded() {
        var i;

        for (i = 0; i < boardNames.length; i += 1) {
            if (object[i] === undefined) {
                return false;
            }
        }

        return true;
    }

    object = Object.create([], {
        load: {value: function (onLoaded) {
            this.length = boardNames.length;
            boardNames.forEach(function (boardName, i) {
                boardFactory.load(boardName, function (board) {
                    object[i] = board;
                    if (allBoardsAreLoaded()) {
                        onLoaded();
                    }
                });
            });
        }},

        selected: {get: function () {
            return this[selectedI];
        }},

        selectedI: {
            get: function () {
                return selectedI;
            },
            set: function (newSelectedI) {
                selectedI = newSelectedI;
            }
        }
    });

    return object;
});

// Utility functionality.

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

/*global define */

define('util',[],function () {
    

    return Object.create(null, {
        whenDocumentIsReady: {value: function (onDocumentIsReady) {
            if (document.readyState === 'complete') {
                onDocumentIsReady();
            } else {
                document.addEventListener('readystatechange', function () {
                    if (document.readyState === 'complete') {
                        onDocumentIsReady();
                    }
                });
            }
        }},

        clear: {value: function (el) {
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
        }}
    });
});

// Creates rectangles in coordinates of tiles.

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

/*global define */

define('rect_t_factory',[],function () {
    

    var prototype, areSamePosT;

    areSamePosT = function (pos1T, pos2T) {
        return pos1T[0] === pos2T[0] && pos1T[1] === pos2T[1];
    };

    prototype = Object.create([], {
        isEqualTo: {value: function (rectT) {
            return (areSamePosT(this[0], rectT[0]) &&
                    areSamePosT(this[1], rectT[1]));
        }},
        widthT: {get: function () {
            return this[1][0] - this[0][0];
        }},
        heightT: {get: function () {
            return this[1][1] - this[0][1];
        }},
        centerT: {get: function () {
            return [(this[0][0] + this[1][0]) / 2,
                    (this[0][1] + this[1][1]) / 2];
        }},
        contains: {value: function (posT) {
            var xT = posT[0], yT = posT[1];
            return (xT >= this[0][0] && yT >= this[0][1] &&
                    xT <= this[1][0] && yT <= this[1][1]);
        }},
        isSquare: {get: function () {
            return this.widthT === this.heightT;
        }}
    });

    return Object.create(null, {
        // Creates rectangle from top-left and bottom-right corners.
        create: {value: function (tlPosT, brPosT) {
            var newRectT = Object.create(prototype);

            newRectT.push(tlPosT);
            newRectT.push(brPosT);

            return newRectT;
        }}
    });
});

// Functionality for the coordinate system in the display canvases.

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

/*global define */

define('display_c_sys',['boards'], function (boards) {
    

    var sideLen, board,
        tileSideLen = 0,
        spacing = 0,
        spacingIsDisabled = false;

    function updateDimensions() {
        var sideLenT;

        if (board !== undefined) {
            sideLenT = board.sideLenT;
            spacing = spacingIsDisabled ? 0 : 0.05 * sideLen / sideLenT;
            tileSideLen = (sideLen - spacing * (sideLenT + 1)) / sideLenT;
        }
    }

    return Object.create(null, {
        sideLen: {set: function (x) {
            if (x !== sideLen) {
                sideLen = x;
                updateDimensions();
            }
        }},

        animStep: {value: function () {
            if (boards.selected !== board) {
                board = boards.selected;
                updateDimensions();
            }
        }},

        // Converts tile position to screen position.
        posFromPosT: {value: function (posT) {
            return posT.map(function (coordT) {
                return coordT * (tileSideLen + spacing) + spacing;
            });
        }},

        // inverse of `posFromPosT`, with `Math.floor` applied to each element
        posTFromPos: {value: function (pos) {
            return pos.map(function (coord) {
                return (coord - spacing) / (tileSideLen + spacing);
            });
        }},

        // If the specified position is in spacing between tiles, then
        // coordinates in question are shifted so that they are in the middle
        // of the next tile to the upper and/or left.
        decIfInSpacing: {value: function (pos) {
            return pos.map(function (coord) {
                var modulo = coord % (tileSideLen + spacing);
                return ((coord > 0 && modulo < spacing) ?
                        (coord - modulo - tileSideLen / 2) :
                        coord);
            });
        }},

        // Like `decIfInSpacing` but shifts to the tile to the lower and/or
        // right.
        incIfInSpacing: {value: function (pos) {
            return pos.map(function (coord) {
                var modulo = coord % (tileSideLen + spacing);
                return ((coord > 0 && modulo < spacing) ?
                        (coord - modulo + spacing + tileSideLen / 2) :
                        coord);
            });
        }},

        // Returns posT, if necessary truncates so that it fits into the board.
        posTInBounds: {value: function (posT) {
            return posT.map(function (coordT) {
                return Math.min(Math.max(coordT, 0), board.sideLenT - 1);
            });
        }},

        tileSideLen: {get: function () {
            return tileSideLen;
        }},

        spacing: {get: function () {
            return spacing;
        }},

        disableSpacing: {value: function () {
            spacingIsDisabled = true;
            updateDimensions();
        }},

        enableSpacing: {value: function () {
            spacingIsDisabled = false;
            updateDimensions();
        }}
    });
});

// Factory for prototypes for any of the canvases used for displaying the
// interactive board.

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

/*global define */

define('display_canvas_factory',[],function () {
    

    // Returns true, iff visibility has been updated.
    function updateVisibility(internal, el) {
        if (internal.isVisible) {
            el.style.display = 'block';
            internal.needsToBeRendered = true;
        } else {
            el.style.display = 'none';
        }
        internal.visibilityNeedsToBeUpdated = false;
    }

    function show(internal) {
        if (!internal.isVisible) {
            internal.isVisible = true;
            internal.visibilityNeedsToBeUpdated = true;
        }
    }

    function hide(internal) {
        if (internal.isVisible) {
            internal.isVisible = false;
            internal.visibilityNeedsToBeUpdated = true;
        }
    }

    return Object.create(null, {
        create: {value: function () {
            var internal = {
                isVisible: true,
                visibilityNeedsToBeUpdated: true
            };

            return Object.create(null, {
                visibilityNeedsToBeUpdated: {get: function () {
                    return internal.visibilityNeedsToBeUpdated;
                }},

                isVisible: {get: function () {
                    return internal.isVisible;
                }},

                updateVisibility: {value: function (el) {
                    updateVisibility(internal, el);
                }},

                show: {value: function () {
                    show(internal);
                }},

                hide: {value: function () {
                    hide(internal);
                }}
            });
        }}
    });
});

// Rubber band that the user may drag to select tiles.

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

/*global define */

define('rubber_band_canvas',[
    'util', 'rect_t_factory', 'display_c_sys', 'display_canvas_factory'
], function (util, rectTFactory, displayCSys, displayCanvasFactory) {
    

    var sideLen, // side length of canvas
        pos1 = [0, 0], // 1st corner of rectangle
        pos2 = [0, 0], // 2nd corner of rectangle
        selectedRectT = rectTFactory.create([0, 0], [0, 0]),
        draggedToTheRight,
        needsToBeRendered = true,
        isBeingDragged = false,
        lineWidth = 1,
        onDrag2, // configurable handler, called at the end of `onDrag`
        onDragStart2,
        onDragEnd2;

    // may be negative
    function width() {
        return pos2[0] - pos1[0];
    }

    // may be negative
    function height() {
        return pos2[1] - pos1[1];
    }

    function render(el) {
        var ctx = el.getContext('2d');

        el.height = el.width = sideLen; // also clears canvas
        lineWidth = 0.005 * sideLen;

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = 'round';
        ctx.strokeRect(pos1[0], pos1[1], width(), height());
    }

    // top left corner
    function tlPos() {
        return [Math.min(pos1[0], pos2[0]), Math.min(pos1[1], pos2[1])];
    }

    // bottom right corner
    function brPos() {
        return [Math.max(pos1[0], pos2[0]), Math.max(pos1[1], pos2[1])];
    }

    // Updates the selected rectangle, which is represented by an array:
    //
    // * 0: position (tile coordinates) of top left selected tile
    //
    // * 1: position bottom right selected tile
    //
    // A tile is selected, if it is inside or if it is touched by the rubber
    // band. Spacing is *not* part of tiles!
    function updateSelectedRectT() {
        var tlPos2 = displayCSys.incIfInSpacing(tlPos()),
            brPos2 = displayCSys.decIfInSpacing(brPos()),
            tlPosT = displayCSys.posTInBounds(
                displayCSys.posTFromPos(tlPos2).map(Math.floor)
            ),
            brPosT = displayCSys.posTInBounds(
                displayCSys.posTFromPos(brPos2).map(Math.floor)
            );

        selectedRectT = rectTFactory.create(tlPosT, brPosT);
    }

    function updateDraggedToTheRight() {
        draggedToTheRight = pos2[0] > pos1[0];
    }

    // assumes that canvas is at position 0, 0 in the document
    function onDragStart(pos) {
        pos2 = pos1 = pos;
        updateSelectedRectT();
        updateDraggedToTheRight();
        isBeingDragged = true;
        needsToBeRendered = true;
        if (onDragStart2 !== undefined) {
            onDragStart2();
        }
    }

    function onDrag(pos) {
        pos2 = pos;
        updateSelectedRectT();
        updateDraggedToTheRight();
        needsToBeRendered = true;
        if (onDrag2 !== undefined) {
            onDrag2(selectedRectT, draggedToTheRight);
        }
    }

    function onDragEnd() {
        isBeingDragged = false;
        needsToBeRendered = true;
        pos1 = pos2 = [0, 0]; // reset
        updateSelectedRectT();
        updateDraggedToTheRight();
        if (onDragEnd2 !== undefined) {
            onDragEnd2();
        }
    }

    function onMouseDown(e) {
        onDragStart([e.pageX, e.pageY]);
    }

    function onTouchStart(e) {
        var touches = e.changedTouches;

        e.preventDefault();
        if (touches.length > 0) {
            onDragStart([touches[0].pageX, touches[0].pageY]);
        }
    }

    function onMouseMove(e) {
        if (isBeingDragged) {
            onDrag([e.pageX, e.pageY]);
        }
    }

    function onTouchMove(e) {
        var touches = e.changedTouches;

        e.preventDefault();
        if (isBeingDragged) {
            if (touches.length > 0) {
                onDrag([touches[0].pageX, touches[0].pageY]);
            }
        }
    }

    function onMouseUp(e) {
        if (isBeingDragged) {
            onDragEnd();
        }
    }

    function onTouchEnd(e) {
        var touches = e.changedTouches;

        e.preventDefault();
        if (isBeingDragged) {
            onDragEnd();
        }
    }

    util.whenDocumentIsReady(function () {
        var el = document.getElementById('rubberBandCanvas');

        el.addEventListener('mousedown', onMouseDown);
        el.addEventListener('touchstart', onTouchStart);

        // Some events are assigned to `window` so that they are also
        // registered when the mouse is moved outside of the window.
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchend', onTouchEnd);
        window.addEventListener('touchcancel', onTouchEnd);
    });

    return Object.create(displayCanvasFactory.create(), {
        animStep: {value: function () {
            var el = document.getElementById('rubberBandCanvas');

            if (this.visibilityNeedsToBeUpdated) {
                this.updateVisibility(el);
                if (this.isVisible) {
                    needsToBeRendered = true;
                }
            }

            if (needsToBeRendered) {
                render(el);
                needsToBeRendered = false;
            }
        }},

        isBeingDragged: {get: function () {
            return isBeingDragged;
        }},

        sideLen: {set: function (x) {
            if (x !== sideLen) {
                sideLen = x;
                needsToBeRendered = true;
            }
        }},

        onDragStart: {set: function (x) {
            onDragStart2 = x;
        }},

        onDrag: {set: function (x) {
            onDrag2 = x;
        }},

        onDragEnd: {set: function (x) {
            onDragEnd2 = x;
        }}
    });
});

// Shows rotation animation.

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

/*global define */

define('rot_anim_canvas',[
    'boards', 'display_c_sys', 'display_canvas_factory'
], function (boards, displayCSys, displayCanvasFactory) {
    

    var sideLen,
        tiles, // tiles, in position *after* rotation
        animIsRunning,
        rectT, // tiles inside of this rectangle are rotated
        startTime, // time when animation started, in milliseconds
        startAngle, // rad
        angle, // current angle, in rad
        direction, // rotation direction (-1, or +1)
        board;

    function renderTile(ctx, posT, rotCenter) {
        var pos = displayCSys.posFromPosT(posT),
            color = tiles[posT[0]][posT[1]].color,
            tileSideLen = displayCSys.tileSideLen;

        ctx.fillStyle = color;
        ctx.fillRect(pos[0] - rotCenter[0], pos[1] - rotCenter[1],
                     tileSideLen, tileSideLen);
    }

    function render(el) {
        var xT, yT,
            ctx = el.getContext('2d'),
            xMinT = rectT[0][0],
            yMinT = rectT[0][1],
            xMaxT = rectT[1][0],
            yMaxT = rectT[1][1],
            center = displayCSys.posFromPosT(rectT.centerT),
            rotCenter = [center[0] + displayCSys.tileSideLen / 2,
                         center[1] + displayCSys.tileSideLen / 2];

        el.width = el.height = sideLen; // also clears canvas

        ctx.save();
        ctx.translate(rotCenter[0], rotCenter[1]);
        ctx.rotate(angle);

        for (xT = xMinT; xT <= xMaxT; xT += 1) {
            for (yT = yMinT; yT <= yMaxT; yT += 1) {
                renderTile(ctx, [xT, yT], rotCenter);
            }
        }

        ctx.restore();
    }

    function passedTime() {
        return Date.now() - startTime;
    }

    function rotationIsFinished() {
        return direction < 0 ? angle <= 0 : angle >= 0;
    }

    function updateAngle() {
        var speed = 0.004; // rad / s

        angle = startAngle + direction * speed * passedTime();

        if (rotationIsFinished()) {
            angle = 0; // avoids rotation beyond 0 (would look ugly)
        }
    }

    return Object.create(displayCanvasFactory.create(), {
        animStep: {value: function () {
            var el = document.getElementById('rotAnimCanvas');

            if (this.visibilityNeedsToBeUpdated) {
                this.updateVisibility(el);
            }

            if (animIsRunning) {
                updateAngle();
                if (!rotationIsFinished()) {
                    render(el);
                } else {
                    animIsRunning = false;
                    this.hide();
                }
            }
        }},

        sideLen: {set: function (x) {
            sideLen = x;
        }},

        animIsRunning: {get: function () {
            return animIsRunning;
        }},

        isInRotRect: {value: function (posT) {
            return rectT.contains(posT);
        }},

        // Starts new animation, showing the last rotation.
        startAnim: {value: function (lastRotation) {
            board = boards.selected;
            tiles = board.tiles.copy();
            rectT = lastRotation.rectT;
            animIsRunning = true;
            startTime = Date.now();
            direction = -lastRotation.direction;
            startAngle = lastRotation.angleRad;
            this.show();
        }}
    });
});

// Shows arrow indicating direction of rotation.

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

/*global define */

define('arrow_canvas',[
    'display_c_sys', 'display_canvas_factory'
], function (displayCSys, displayCanvasFactory) {
    

    var sideLen,
        needsToBeRendered = false,
        rotation,
        object;

    function renderArc(ctx, x, y, u, angleDeg) {
        var endAngle = (angleDeg === 90 || angleDeg === -90 ?
                        Math.PI / 2 : Math.PI);
        ctx.beginPath();
        ctx.arc(x + 10 * u, y + 10 * u, 1.5 * u, 0, endAngle);
        ctx.stroke();
    }

    function renderTriangle(ctx, x, y, u, angleDeg) {
        var s;

        ctx.beginPath();
        if (angleDeg === 90 || angleDeg === 180 || angleDeg === -180) {
            s = (angleDeg === -180) ? -3 * u : 0;
            ctx.moveTo(x + 10 * u + s, y + 10 * u);
            ctx.lineTo(x + 13 * u + s, y + 10 * u);
            ctx.lineTo(x + 11.5 * u + s, y + 8 * u);
            ctx.lineTo(x + 10 * u + s, y + 10 * u);
        } else {
            ctx.moveTo(x + 10 * u, y + 10 * u);
            ctx.lineTo(x + 8 * u, y + 11.5 * u);
            ctx.lineTo(x + 10 * u, y + 13 * u);
            ctx.lineTo(x + 10 * u, y + 10 * u);
        }
        ctx.fill();
        ctx.closePath();
    }

    function renderArrow(ctx, posT, angleDeg) {
        var pos = displayCSys.posFromPosT(posT),
            x = pos[0],
            y = pos[1],
            tsl = displayCSys.tileSideLen,
            u = tsl / 14;

        ctx.lineWidth = u;
        renderArc(ctx, x, y, u, angleDeg);
        renderTriangle(ctx, x, y, u, angleDeg);
    }

    function render(el) {
        var ctx = el.getContext('2d');

        el.height = el.width = sideLen; // also clears canvas

        if (rotation !== undefined && rotation.makesSense) {
            renderArrow(ctx, rotation.rectT[1], rotation.angleDeg);
        }
    }

    object = Object.create(displayCanvasFactory.create(), {
        animStep: {value: function () {
            var el = document.getElementById('arrowCanvas');

            if (this.visibilityNeedsToBeUpdated) {
                this.updateVisibility(el);
                if (this.isVisible) {
                    needsToBeRendered = true;
                }
            }

            if (needsToBeRendered) {
                render(el);
                needsToBeRendered = false;
            }
        }},

        rotation: {set: function (x) {
            if (rotation === undefined || !rotation.isEqualTo(x)) {
                rotation = x;
                if (this.isVisible) {
                    needsToBeRendered = true;
                }
            }
        }},

        sideLen: {set: function (x) {
            if (x !== sideLen) {
                sideLen = x;
                if (this.isVisible) {
                    needsToBeRendered = true;
                }
            }
        }}
    });

    object.hide();

    return object;
});

// Creates objects that describe rotations.

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

/*global define */

define('rotation_factory',[],function () {
    

    var prototype = Object.create(null, {
        isEqualTo: {value: function (rotation) {
            return (this.rectT.isEqualTo(rotation.rectT) &&
                    this.cw === rotation.cw);
        }},

        // rotations of just one tile don't make sense
        makesSense: {get: function () {
            return this.rectT.widthT > 0 || this.rectT.heightT > 0;
        }},

        direction: {get: function () {
            return this.cw ? -1 : 1;
        }},

        angleRad: {get: function () {
            return this.direction * (this.rectT.isSquare ?
                                     Math.PI / 2 : Math.PI);
        }},

        angleDeg: {get: function () {
            return this.direction * (this.rectT.isSquare ? 90 : 180);
        }},

        inverse: {get: function () {
            var rectT = this.rectT, cw = !this.cw;

            return Object.create(prototype, {
                rectT: {get: function () { return rectT; }},

                // direction (true: clock wise)
                cw: {get: function () { return cw; }}
            });
        }}
    });

    return Object.create(null, {
        create: {value: function (rectT, cw) {
            return Object.create(prototype, {
                rectT: {get: function () { return rectT; }},

                // direction (true: clock wise)
                cw: {get: function () { return cw; }}
            });
        }}
    });
});

// Displays the tiles in the interactive board.

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

/*global define */

define('tiles_canvas',[
    'boards', 'rubber_band_canvas', 'rot_anim_canvas', 'arrow_canvas',
    'display_c_sys', 'display_canvas_factory', 'rotation_factory',
    'rect_t_factory'
], function (boards, rubberBandCanvas, rotAnimCanvas, arrowCanvas,
             displayCSys, displayCanvasFactory, rotationFactory,
             rectTFactory) {
    

    var sideLen, tiles, board,
        needsToBeRendered = true,
        selectedRectT, // when dragged: currently selected rectangle
        draggedToTheRight, // when dragged: current drag direction
        animIsRunning,
        rotation,
        initRotAnimHasToBeTriggered = true;

    function updateRotation() {
        if (selectedRectT === undefined) {
            rotation = undefined;
        } else {
            rotation = rotationFactory.create(selectedRectT,
                                              draggedToTheRight);
        }
    }

    function tilesNeedUpdate() {
        return tiles === undefined || !board.tiles.areEqualTo(tiles);
    }

    function animIsRunningNeedsUpdate() {
        return (animIsRunning === undefined ||
                animIsRunning !== rotAnimCanvas.animIsRunning);
    }

    function boardNeedsUpdate() {
        return board === undefined || board !== boards.selected;
    }

    function onRubberBandDragStart() {
        arrowCanvas.show();
    }

    function onRubberBandDrag(newSelectedRectT, newDraggedToTheRight) {
        if (selectedRectT === undefined ||
                !newSelectedRectT.isEqualTo(selectedRectT) ||
                newDraggedToTheRight !== draggedToTheRight) {
            selectedRectT = newSelectedRectT;
            draggedToTheRight = newDraggedToTheRight;
            needsToBeRendered = true;
            updateRotation();
            arrowCanvas.rotation = rotation;
        }
    }

    function onRubberBandDragEnd() {
        if (rotation !== undefined && rotation.makesSense &&
                !boards.selected.isFinished) {
            boards.selected.rotate(rotation);
        }

        if (boards.selected.isFinished) {
            rubberBandCanvas.hide();
        } else {
            rubberBandCanvas.show();
        }

        arrowCanvas.hide();

        selectedRectT = undefined;
        updateRotation();

        needsToBeRendered = true;
    }

    function tileIsSelected(posT) {
        return (rubberBandCanvas.isBeingDragged &&
                selectedRectT !== undefined &&
                posT[0] >= selectedRectT[0][0] &&
                posT[0] <= selectedRectT[1][0] &&
                posT[1] >= selectedRectT[0][1] &&
                posT[1] <= selectedRectT[1][1]);
    }

    function renderTile(ctx, posT) {
        var pos = displayCSys.posFromPosT(posT),
            color = tiles[posT[0]][posT[1]].color,
            showSelection = rubberBandCanvas.isBeingDragged,
            tileSideLen = displayCSys.tileSideLen,

            // to avoid ugly thin black lines when there is no spacing
            // (rendering error with many browsers as of Sept. 2012)
            lenAdd = displayCSys.spacing === 0 ? 1 : 0;

        if (rotAnimCanvas.animIsRunning && rotAnimCanvas.isInRotRect(posT)) {
            return; // don't show this tile, it's animated
        }

        ctx.globalAlpha = showSelection && tileIsSelected(posT) ? 0.5 : 1;
        ctx.fillStyle = color;
        ctx.fillRect(pos[0], pos[1],
                     tileSideLen + lenAdd, tileSideLen + lenAdd);
    }

    function render() {
        var xT, yT,
            sideLenT = board.sideLenT,
            el = document.getElementById('tilesCanvas'),
            ctx = el.getContext('2d'),
            renderAsFinished = (board.isFinished &&
                                !rotAnimCanvas.animIsRunning);

        el.height = el.width = sideLen;

        if (renderAsFinished) {
            displayCSys.disableSpacing();
        }

        for (xT = 0; xT < sideLenT; xT += 1) {
            for (yT = 0; yT < sideLenT; yT += 1) {
                renderTile(ctx, [xT, yT]);
            }
        }

        if (renderAsFinished) {
            displayCSys.enableSpacing();
        }
    }

    function startRotationAnim() {
        var lastRotation = board.lastRotation;
        if (lastRotation !== null) {
            rotAnimCanvas.startAnim(lastRotation);
        }
    }

    function updateTiles(boardHasChanged) {
        tiles = board.tiles.copy();

        if (!boardHasChanged) {
            startRotationAnim();
        } // else: change in tiles not due to rotation

        if (boards.selected.isFinished) {
            rubberBandCanvas.hide();
        } else {
            rubberBandCanvas.show(); // necessary e.g. after undoing finished
        }

        arrowCanvas.hide(); // necessary e.g. after undoing finished
    }

    // Triggers a rotation animation that is shown when the canvas is first
    // displayed. This rotation serves as a hint concerning how the game works.
    function triggerInitRotAnim() {
        var initRotation = rotationFactory.create(
            rectTFactory.create([0, 0], [tiles.widthT - 1, tiles.heightT - 1]),
            true
        );
        rotAnimCanvas.startAnim(initRotation);
    }

    rubberBandCanvas.onDragStart = onRubberBandDragStart;
    rubberBandCanvas.onDrag = onRubberBandDrag;
    rubberBandCanvas.onDragEnd = onRubberBandDragEnd;

    return Object.create(displayCanvasFactory.create(), {
        animStep: {value: function () {
            var boardHasChanged;

            if (boardNeedsUpdate()) {
                needsToBeRendered = true;
                board = boards.selected;
                boardHasChanged = true;
            } else {
                boardHasChanged = false;
            }

            if (tilesNeedUpdate()) {
                updateTiles(boardHasChanged);
                needsToBeRendered = true;
            }

            if (initRotAnimHasToBeTriggered) {
                triggerInitRotAnim();
                initRotAnimHasToBeTriggered = false;
            }

            if (animIsRunningNeedsUpdate()) {
                needsToBeRendered = true;
                animIsRunning = rotAnimCanvas.animIsRunning;
            }

            if (needsToBeRendered) {
                render();
                needsToBeRendered = false;
            }
        }},

        sideLen: {set: function (x) {
            if (x !== sideLen) {
                sideLen = x;
                needsToBeRendered = true;
            }
        }}
    });
});

// Shows the interactive board, for playing.

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

/*global define */

define('display',[
    'tiles_canvas', 'arrow_canvas', 'rubber_band_canvas', 'rot_anim_canvas',
    'display_c_sys'
], function (tilesCanvas, arrowCanvas, rubberBandCanvas, rotAnimCanvas,
             displayCSys) {
    

    var isVisible = false,
        sideLen,
        needsToBeRendered = true;

    function render() {
        var s = document.getElementById('display').style;

        if (isVisible) {
            s.display = 'block';
        }
        s.width = sideLen + 'px';
        s.height = sideLen + 'px';
    }

    return Object.create(null, {
        animStep: {value: function () {
            if (isVisible) {
                if (needsToBeRendered) {
                    render();
                    needsToBeRendered = false;
                }
                displayCSys.animStep();
                tilesCanvas.animStep();
                arrowCanvas.animStep();
                rubberBandCanvas.animStep();
                rotAnimCanvas.animStep();
            }
        }},

        sideLen: {set: function (newSideLen) {
            if (newSideLen !== sideLen) {
                sideLen = newSideLen;
                displayCSys.sideLen = sideLen;
                tilesCanvas.sideLen = sideLen;
                arrowCanvas.sideLen = sideLen;
                rubberBandCanvas.sideLen = sideLen;
                rotAnimCanvas.sideLen = sideLen;
                needsToBeRendered = true;
            }
        }},

        show: {value: function () {
            isVisible = true;
            needsToBeRendered = true;
        }}
    });
});

// Creates thumbnails of boards, showing the tiles of the finished board ("end
// tiles").

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

/*global define */

define('board_thumb_factory',['boards'], function (boards) {
    

    function posFromPosT(posT, sideLen, sideLenT) {
        return posT.map(function (coordT) {
            return coordT * sideLen / sideLenT;
        });
    }

    function renderTile(ctx, board, posT, sideLen) {
        var sideLenT = board.sideLenT,
            tiles = board.endTiles,
            pos = posFromPosT(posT, sideLen, sideLenT),
            color = tiles[posT[0]][posT[1]].color,
            tileSideLen = sideLen / sideLenT + 1; // +1 to avoid ugly spacing

        ctx.fillStyle = color;
        ctx.fillRect(pos[0], pos[1], tileSideLen, tileSideLen);
    }

    // Renders the board to canvas.
    //
    // Why not simply display the board image in an `<img>` tag, and scale
    // that? Rationale: As of Chrome 21.0, when scaling an image in an `<img>`
    // tag, then it is smoothed/blurred, and there is no way to turn off that
    // behavior. In particular, there is no equivalent to Firefox 14.0's
    // `-moz-crisp-edges`.
    function render(el, board, sideLen, x, y) {
        var xT, yT,
            sideLenT = board.sideLenT,
            ctx = el.getContext('2d');

        el.width = el.height = sideLen; // also clears canvas
        el.style.left = (x - sideLen / 2) + 'px';
        el.style.top = (y - sideLen / 2) + 'px';

        for (xT = 0; xT < sideLenT; xT += 1) {
            for (yT = 0; yT < sideLenT; yT += 1) {
                renderTile(ctx, board, [xT, yT], sideLen);
            }
        }
    }

    return Object.create(null, {
        create: {value: function (boardI, onThumbSelected) {
            var el = document.createElement('canvas'),
                needsToBeRendered = true,
                sideLen = 0,
                x = 0, // x-position of center within outher container
                y = 0;

            el.addEventListener('click', function () {
                boards.selectedI = boardI;
                onThumbSelected();
            });

            return Object.create(null, {
                element: {get: function () {
                    return el;
                }},

                boardI: {set: function (newBoardI) {
                    if (newBoardI !== boardI) {
                        boardI = newBoardI;
                        needsToBeRendered = true;
                    }
                }},

                sideLen: {set: function (newSideLen) {
                    if (newSideLen !== sideLen) {
                        sideLen = newSideLen;
                        needsToBeRendered = true;
                    }
                }},

                x: {set: function (newX) {
                    if (newX !== x) {
                        x = newX;
                        needsToBeRendered = true;
                    }
                }},

                y: {set: function (newY) {
                    if (newY !== y) {
                        y = newY;
                        needsToBeRendered = true;
                    }
                }},

                animStep: {value: function () {
                    if (needsToBeRendered) {
                        render(el, boards[boardI], sideLen, x, y);
                        needsToBeRendered = false;
                    }
                }}
            });
        }}
    });
});

// For selecting the current board.

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

/*global define */

define('boards_navigator',[
    'boards', 'board_thumb_factory'
], function (boards, boardThumbFactory) {
    

    var width,
        thumbs = [],
        animThumbI = 0, // index of thumb shown in middle (fractional during
                        // animation)
        animStartThumbI,
        animDirection, // direction of animation (-1, or +1)
        animIsRunning = false,
        animStartTime, // time when animation started, in milliseconds
        selectedBoardI = 0,
        elementsNeedToBeAppended = true,
        needsToBeRendered = true,
        nSideThumbs = 2;  // thumbnails displayed to the left/right side of the
                          // currently selected one (needs to be large enough
                          // if e.g. the left-most thumb is the current)
                          //
                          // thumb indexes go from `-nSideThumbs` to
                          // `nSideThumbs`

    // Returns a board index that is within bounds, by cycling if `i` is too
    // small or too large.
    function cycledBoardI(i) {
        return ((i % boards.length) + boards.length) % boards.length;
    }

    // Selected board is always in the middle of the thumbs.
    function boardIFromThumbI(thumbI) {
        return cycledBoardI(selectedBoardI + thumbI);
    }

    function updateThumbsCoordinates() {
        var thumbI, thumb, j;

        thumbs.forEach(function (thumb, i) {
            var thumbI = i - nSideThumbs;
            j = thumbI - animThumbI; // `j` is 0 => board centered
            thumb.sideLen = width / (4 + 2 * Math.abs(j));
            thumb.x = j * (width / 3) + width / 2;
            thumb.y = width / 8;
        });
    }

    function updateThumbs() {
        thumbs.forEach(function (thumb, i) {
            var thumbI = i - nSideThumbs;
            thumb.boardI = boardIFromThumbI(thumbI);
        });
    }

    function updateSelectedBoardI() {
        selectedBoardI = boards.selectedI;
        updateThumbs();
    }

    // Note: The index of the selected thumb will become 0, after the thumbs
    // have been rearrange (see: `updateThumbs`). So animation of the thumb
    // index is always towards 0.
    function startAnim(selectedThumbI) {
        animStartThumbI = animThumbI - selectedThumbI;
        animDirection = animStartThumbI > 0 ? -1 : 1;
        animStartTime = Date.now();
        animIsRunning = true;
    }

    function onThumbSelected(selectedThumbI) {
        startAnim(selectedThumbI);
        updateSelectedBoardI();
    }

    function newThumb(thumbI) {
        return boardThumbFactory.create(boardIFromThumbI(thumbI), function () {
            onThumbSelected(thumbI);
        });
    }

    function createThumbs() {
        var thumbI;

        thumbs.length = 0;
        for (thumbI = -nSideThumbs; thumbI <= nSideThumbs; thumbI += 1) {
            thumbs.push(newThumb(thumbI));
        }

        updateThumbsCoordinates();
    }

    function thumbsAnimationSteps() {
        thumbs.forEach(function (thumb) {
            thumb.animStep();
        });
    }

    function appendElements(el) {
        thumbs.forEach(function (thumb) {
            el.appendChild(thumb.element);
        });
    }

    function thumbsHaveBeenCreated() {
        return thumbs.length > 0;
    }

    function render() {
        var el = document.getElementById('boardsNavigator'),
            s = el.style;

        s.width = width + 'px';
        s.height = width / 4 + 'px';

        if (elementsNeedToBeAppended && thumbsHaveBeenCreated()) {
            appendElements(el);
            elementsNeedToBeAppended = false;
        }
    }

    function animPassedTime() {
        return Date.now() - animStartTime;
    }

    function animIsFinished() {
        return ((animDirection > 0 && animThumbI >= 0) ||
                (animDirection < 0 && animThumbI <= 0));
    }

    function updateThumbI() {
        var speed = 0.005;

        animThumbI = (animStartThumbI +
                      animDirection * speed * animPassedTime());

        if (animIsFinished()) {
            animThumbI = 0; // avoids movement that is too far
            animIsRunning = false;
        }

        updateThumbsCoordinates();
    }

    return Object.create(null, {
        animStep: {value: function () {
            if (needsToBeRendered) {
                render();
                needsToBeRendered = false;
            }

            thumbsAnimationSteps();

            if (animIsRunning) {
                updateThumbI();
                updateThumbsCoordinates();
            }
        }},

        activate: {value: function () {
            // boards are now definitely loaded
            createThumbs();
            needsToBeRendered = true;
        }},

        width: {set: function (newWidth) {
            if (newWidth !== width) {
                width = newWidth;
                updateThumbsCoordinates();
                needsToBeRendered = true;
            }
        }}
    });
});

// Displays the list of a board's top players as a table.

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

/*global define */

define('hiscores_table',['util', 'boards'], function (util, boards) {
    

    // fixme: remove if unused
    var board, nameInputFieldEl, submitButtonEl,
        boardIsFinished,
        submitIsEnabled = false,
        needsToBeRendered = true;

    function newTdEl(text) {
        var el = document.createElement('td');

        el.appendChild(document.createTextNode(text));

        return el;
    }

    function newTrEl(hiscore) {
        var el = document.createElement('tr');

        el.appendChild(newTdEl(hiscore.name));
        el.appendChild(newTdEl(hiscore.nRotations));

        return el;
    }

    // updates name in new hiscore entry, but does *not* save it yet
    function onNameInputFieldBlur() {
        board.hiscores.nameInProposal = nameInputFieldEl.value;
    }

    function onSubmit() {
        if (submitIsEnabled) {
            board.hiscores.nameInProposal = nameInputFieldEl.value;

            // Note that repeated calls to this function have no effect, since
            // after insertion (successful or not), the proposal is removed.
            board.hiscores.saveProposal();

            needsToBeRendered = true;
        }
    }

    function updateSubmitButtonClasses() {
        var className;

        if (submitButtonEl !== undefined) {
            className = 'submit button' + (submitIsEnabled ? '' : ' disabled');
            submitButtonEl.className = className;
        }
    }

    // Updates: no name => submit does not work, and submit button is disabled
    function updateAbilityToSubmit() {
        submitIsEnabled = nameInputFieldEl.value !== '';
        updateSubmitButtonClasses();
    }

    function onKeyUpInNameInputField(e) {
        updateAbilityToSubmit();
        if (e.keyCode === 13) { // enter key
            onSubmit();
        }
    }

    // Caches the input field element.
    function newNameInputTdEl(name) {
        var el = document.createElement('td');

        if (nameInputFieldEl === undefined) {
            nameInputFieldEl = document.createElement('input');
            nameInputFieldEl.type = 'text';
            nameInputFieldEl.maxLength = nameInputFieldEl.size =
                board.hiscores.maxNameLen;
            nameInputFieldEl.spellcheck = false;
            nameInputFieldEl.addEventListener('blur', onNameInputFieldBlur);
            nameInputFieldEl.addEventListener('keyup',
                                              onKeyUpInNameInputField);
            nameInputFieldEl.addEventListener('propertychange',
                                              updateAbilityToSubmit);
            nameInputFieldEl.addEventListener('input', updateAbilityToSubmit);
            nameInputFieldEl.addEventListener('paste', updateAbilityToSubmit);
        }
        nameInputFieldEl.value = name;
        el.appendChild(nameInputFieldEl);

        updateAbilityToSubmit(); // depends on `name`

        return el;
    }

    // Caches the submit button element.
    function newSubmitButtonTdEl() {
        var el = document.createElement('td');

        if (submitButtonEl === undefined) {
            submitButtonEl = document.createElement('span');
            submitButtonEl.appendChild(
                document.createTextNode('↵') // &crarr;
            );
            submitButtonEl.addEventListener('click', onSubmit);
            updateSubmitButtonClasses();
        }

        el.appendChild(submitButtonEl);

        return el;
    }

    function newInputTrEl(hiscore) {
        var el = document.createElement('tr');

        el.className = 'input';
        el.appendChild(newNameInputTdEl(hiscore.name));
        el.appendChild(newSubmitButtonTdEl());

        return el;
    }

    function render() {
        var i, hiscore,
            el = document.getElementById('hiscoresTable'),
            hiscores = board.hiscores,
            maxI = hiscores.length;

        util.clear(el);

        board.hiscores.forEach(function (hiscore, i, isEditable) {
            if (isEditable) {
                el.appendChild(newInputTrEl(hiscore));
            } else {
                el.appendChild(newTrEl(hiscore));
            }
        });
    }

    return Object.create(null, {
        animStep: {value: function () {
            if (boards.selected !== board) {
                board = boards.selected;
                boardIsFinished = board.isFinished;
                needsToBeRendered = true;
            } else if (board.isFinished !== boardIsFinished) {
                boardIsFinished = board.isFinished;
                needsToBeRendered = true;
            }

            if (needsToBeRendered) {
                render();
                needsToBeRendered = false;
            }
        }}
    });
});

// Shows the number of steps and allows undo and redo operations.

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

/*global define */

define('rotations_navigator',['boards', 'util'], function (boards, util) {
    

    var nRotations, board,
        needsToBeRendered = true;

    function buttonEl(type) {
        return document.querySelector('#rotationsNavigator>.' + type +
                                      '.button');
    }

    function onUndoClick() {
        board.undo();
    }

    function onRedoClick() {
        board.redo();
    }

    function setupButton(type, onClick) {
        buttonEl(type).addEventListener('click', onClick);
    }

    function renderButton(type, isDisabled) {
        // `classList` is not used as it isn't supported by Android 2.3 browser

        var className = type + ' button';

        if (isDisabled) {
            className += ' disabled';
        }

        buttonEl(type).className = className;
    }

    function renderUndoButton() {
        renderButton('undo', !board.undoIsPossible);
    }

    function renderRedoButton() {
        renderButton('redo', !board.redoIsPossible);
    }

    function render() {
        document.getElementById('nRotations').textContent = nRotations;
        renderUndoButton();
        renderRedoButton();
    }

    util.whenDocumentIsReady(function () {
        setupButton('undo', onUndoClick);
        setupButton('redo', onRedoClick);
    });

    return Object.create(null, {
        animStep: {value: function () {
            if (boards.selected !== board) {
                board = boards.selected;
                needsToBeRendered = true;
            }

            if (board.nRotations !== nRotations) {
                nRotations = board.nRotations;
                needsToBeRendered = true;
            }

            if (needsToBeRendered) {
                render();
                needsToBeRendered = false;
            }
        }}
    });
});

// Panel that shows information such as the game's name.

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

/*global define */

define('panel',[
    'boards_navigator', 'hiscores_table', 'rotations_navigator'
], function (boardsNavigator, hiscoresTable, rotationsNavigator) {
    

    var width, height,
        needsToBeRendered = true,
        isVisible = false;

    function render() {
        var el = document.getElementById('panel'),
            style = el.style;

        style.display = 'block'; // unhides, if previously hidden
        style.width = width + 'px';
        style.height = height + 'px';
        style.left = height + 'px';
        style.fontSize = Math.ceil(height / 25) + 'px';
    }

    return Object.create(null, {
        animStep: {value: function () {
            if (isVisible) {
                if (needsToBeRendered) {
                    render();
                    needsToBeRendered = false;
                }

                boardsNavigator.animStep();
                hiscoresTable.animStep();
                rotationsNavigator.animStep();
            }
        }},

        show: {value: function () {
            isVisible = true;
            boardsNavigator.activate();
            needsToBeRendered = true;
        }},

        width: {set: function (x) {
            if (x !== width) {
                width = x;
                boardsNavigator.width = width;
                needsToBeRendered = true;
            }
        }},

        height: {set: function (newHeight) {
            if (newHeight !== height) {
                height = newHeight;
                needsToBeRendered = true;
            }
        }}
    });
});

// Shown when the game is loading.

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

/*global define */

define('load_indicator',[],function () {
    

    var isVisible = true,
        needsToBeRendered = true,
        width;

    function render() {
        var style = document.getElementById('loadIndicator').style;

        style.fontSize = Math.ceil(width / 20) + 'px';
        style.top = style.left = Math.round(0.01 * width);
        style.display = 'block';
    }

    return Object.create(null, {
        animStep: {value: function (newWidth) {
            var style;

            if (isVisible && needsToBeRendered) {
                render();
                needsToBeRendered = false;
            }
        }},

        hide: {value: function () {
            document.getElementById('loadIndicator').style.display = 'none';
            isVisible = false;
        }},

        width: {set: function (x) {
            if (x !== width) {
                width = x;
                needsToBeRendered = true;
            }
        }}
    });
});

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
// AMD module by Felix E. Klee <felix.klee@inka.de>


define('vendor/rAF',[],function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
});

// The game.

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

/*global define */

define('game',[
    'display', 'panel', 'boards', 'load_indicator', 'util', 'vendor/rAF'
], function (
    display,
    panel,
    boards,
    loadIndicator,
    util
) {
    

    var width, height; // px

    // The game takes up the space of a golden ratio rectangle that takes up
    // maximum space in the browser window.
    function updateDimensions() {
        var goldenRatio = 1.61803398875,
            innerRatio = window.innerWidth / window.innerHeight;

        if (innerRatio < goldenRatio) {
            width = window.innerWidth;
            height = Math.floor(width / goldenRatio);
        } else {
            height = window.innerHeight;
            width = Math.floor(height * goldenRatio);
        }

        document.body.style.width = width + 'px';
        document.body.style.height = height + 'px';
    }

    function animStep() {
        loadIndicator.animStep();
        display.animStep();
        panel.animStep();

        window.requestAnimationFrame(animStep);
    }

    function startAnim() {
        window.requestAnimationFrame(animStep);
    }

    function onResize() {
        updateDimensions();

        display.sideLen = height;
        panel.width = width - height;
        panel.height = height;

        loadIndicator.width = width;
    }

    util.whenDocumentIsReady(function () {
        startAnim();
        boards.load(function () {
            panel.show();
            display.show();
            loadIndicator.hide();
        });
        onResize(); // captures initial size
        window.addEventListener('resize', onResize);
    });
});

require(["game"]);
}());