
/** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS 2.0.6 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
//Not using strict: uneven strict support in browsers, #392, and causes
//problems with requirejs.exec()/transpiler plugins that may not be strict.
/*jslint regexp: true, nomen: true, sloppy: true */
/*global window, navigator, document, importScripts, jQuery, setTimeout, opera */

var requirejs, require, define;
(function (global) {
    var req, s, head, baseElement, dataMain, src,
        interactiveScript, currentlyAddingScript, mainScript, subPath,
        version = '2.0.6',
        commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
        cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
        jsSuffixRegExp = /\.js$/,
        currDirRegExp = /^\.\//,
        op = Object.prototype,
        ostring = op.toString,
        hasOwn = op.hasOwnProperty,
        ap = Array.prototype,
        aps = ap.slice,
        apsp = ap.splice,
        isBrowser = !!(typeof window !== 'undefined' && navigator && document),
        isWebWorker = !isBrowser && typeof importScripts !== 'undefined',
        //PS3 indicates loaded and complete, but need to wait for complete
        //specifically. Sequence is 'loading', 'loaded', execution,
        // then 'complete'. The UA check is unfortunate, but not sure how
        //to feature test w/o causing perf issues.
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
                      /^complete$/ : /^(complete|loaded)$/,
        defContextName = '_',
        //Oh the tragedy, detecting opera. See the usage of isOpera for reason.
        isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
        contexts = {},
        cfg = {},
        globalDefQueue = [],
        useInteractive = false;

    function isFunction(it) {
        return ostring.call(it) === '[object Function]';
    }

    function isArray(it) {
        return ostring.call(it) === '[object Array]';
    }

    /**
     * Helper function for iterating over an array. If the func returns
     * a true value, it will break out of the loop.
     */
    function each(ary, func) {
        if (ary) {
            var i;
            for (i = 0; i < ary.length; i += 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    /**
     * Helper function for iterating over an array backwards. If the func
     * returns a true value, it will break out of the loop.
     */
    function eachReverse(ary, func) {
        if (ary) {
            var i;
            for (i = ary.length - 1; i > -1; i -= 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Cycles over properties in an object and calls a function for each
     * property value. If the function returns a truthy value, then the
     * iteration is stopped.
     */
    function eachProp(obj, func) {
        var prop;
        for (prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                if (func(obj[prop], prop)) {
                    break;
                }
            }
        }
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     * This is not robust in IE for transferring methods that match
     * Object.prototype names, but the uses of mixin here seem unlikely to
     * trigger a problem related to that.
     */
    function mixin(target, source, force, deepStringMixin) {
        if (source) {
            eachProp(source, function (value, prop) {
                if (force || !hasProp(target, prop)) {
                    if (deepStringMixin && typeof value !== 'string') {
                        if (!target[prop]) {
                            target[prop] = {};
                        }
                        mixin(target[prop], value, force, deepStringMixin);
                    } else {
                        target[prop] = value;
                    }
                }
            });
        }
        return target;
    }

    //Similar to Function.prototype.bind, but the 'this' object is specified
    //first, since it is easier to read/figure out what 'this' will be.
    function bind(obj, fn) {
        return function () {
            return fn.apply(obj, arguments);
        };
    }

    function scripts() {
        return document.getElementsByTagName('script');
    }

    //Allow getting a global that expressed in
    //dot notation, like 'a.b.c'.
    function getGlobal(value) {
        if (!value) {
            return value;
        }
        var g = global;
        each(value.split('.'), function (part) {
            g = g[part];
        });
        return g;
    }

    function makeContextModuleFunc(func, relMap, enableBuildCallback) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0), lastArg;
            if (enableBuildCallback &&
                    isFunction((lastArg = args[args.length - 1]))) {
                lastArg.__requireJsBuild = true;
            }
            args.push(relMap);
            return func.apply(null, args);
        };
    }

    function addRequireMethods(req, context, relMap) {
        each([
            ['toUrl'],
            ['undef'],
            ['defined', 'requireDefined'],
            ['specified', 'requireSpecified']
        ], function (item) {
            var prop = item[1] || item[0];
            req[item[0]] = context ? makeContextModuleFunc(context[prop], relMap) :
                    //If no context, then use default context. Reference from
                    //contexts instead of early binding to default context, so
                    //that during builds, the latest instance of the default
                    //context with its config gets used.
                    function () {
                        var ctx = contexts[defContextName];
                        return ctx[prop].apply(ctx, arguments);
                    };
        });
    }

    /**
     * Constructs an error with a pointer to an URL with more information.
     * @param {String} id the error ID that maps to an ID on a web page.
     * @param {String} message human readable error.
     * @param {Error} [err] the original error, if there is one.
     *
     * @returns {Error}
     */
    function makeError(id, msg, err, requireModules) {
        var e = new Error(msg + '\nhttp://requirejs.org/docs/errors.html#' + id);
        e.requireType = id;
        e.requireModules = requireModules;
        if (err) {
            e.originalError = err;
        }
        return e;
    }

    if (typeof define !== 'undefined') {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    if (typeof requirejs !== 'undefined') {
        if (isFunction(requirejs)) {
            //Do not overwrite and existing requirejs instance.
            return;
        }
        cfg = requirejs;
        requirejs = undefined;
    }

    //Allow for a require config object
    if (typeof require !== 'undefined' && !isFunction(require)) {
        //assume it is a config object.
        cfg = require;
        require = undefined;
    }

    function newContext(contextName) {
        var inCheckLoaded, Module, context, handlers,
            checkLoadedTimeoutId,
            config = {
                waitSeconds: 7,
                baseUrl: './',
                paths: {},
                pkgs: {},
                shim: {}
            },
            registry = {},
            undefEvents = {},
            defQueue = [],
            defined = {},
            urlFetched = {},
            requireCounter = 1,
            unnormalizedCounter = 1,
            //Used to track the order in which modules
            //should be executed, by the order they
            //load. Important for consistent cycle resolution
            //behavior.
            waitAry = [];

        /**
         * Trims the . and .. from an array of path segments.
         * It will keep a leading path segment if a .. will become
         * the first path segment, to help with module name lookups,
         * which act like paths, but can be remapped. But the end result,
         * all paths that use this function should look normalized.
         * NOTE: this method MODIFIES the input array.
         * @param {Array} ary the array of path segments.
         */
        function trimDots(ary) {
            var i, part;
            for (i = 0; ary[i]; i += 1) {
                part = ary[i];
                if (part === '.') {
                    ary.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    if (i === 1 && (ary[2] === '..' || ary[0] === '..')) {
                        //End of the line. Keep at least one non-dot
                        //path segment at the front so it can be mapped
                        //correctly to disk. Otherwise, there is likely
                        //no path mapping for a path starting with '..'.
                        //This can still fail, but catches the most reasonable
                        //uses of ..
                        break;
                    } else if (i > 0) {
                        ary.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
        }

        /**
         * Given a relative module name, like ./something, normalize it to
         * a real name that can be mapped to a path.
         * @param {String} name the relative name
         * @param {String} baseName a real name that the name arg is relative
         * to.
         * @param {Boolean} applyMap apply the map config to the value. Should
         * only be done if this normalization is for a dependency ID.
         * @returns {String} normalized name
         */
        function normalize(name, baseName, applyMap) {
            var pkgName, pkgConfig, mapValue, nameParts, i, j, nameSegment,
                foundMap, foundI, foundStarMap, starI,
                baseParts = baseName && baseName.split('/'),
                normalizedBaseParts = baseParts,
                map = config.map,
                starMap = map && map['*'];

            //Adjust any relative paths.
            if (name && name.charAt(0) === '.') {
                //If have a base name, try to normalize against it,
                //otherwise, assume it is a top-level require that will
                //be relative to baseUrl in the end.
                if (baseName) {
                    if (config.pkgs[baseName]) {
                        //If the baseName is a package name, then just treat it as one
                        //name to concat the name with.
                        normalizedBaseParts = baseParts = [baseName];
                    } else {
                        //Convert baseName to array, and lop off the last part,
                        //so that . matches that 'directory' and not name of the baseName's
                        //module. For instance, baseName of 'one/two/three', maps to
                        //'one/two/three.js', but we want the directory, 'one/two' for
                        //this normalization.
                        normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                    }

                    name = normalizedBaseParts.concat(name.split('/'));
                    trimDots(name);

                    //Some use of packages may use a . path to reference the
                    //'main' module name, so normalize for that.
                    pkgConfig = config.pkgs[(pkgName = name[0])];
                    name = name.join('/');
                    if (pkgConfig && name === pkgName + '/' + pkgConfig.main) {
                        name = pkgName;
                    }
                } else if (name.indexOf('./') === 0) {
                    // No baseName, so this is ID is resolved relative
                    // to baseUrl, pull off the leading dot.
                    name = name.substring(2);
                }
            }

            //Apply map config if available.
            if (applyMap && (baseParts || starMap) && map) {
                nameParts = name.split('/');

                for (i = nameParts.length; i > 0; i -= 1) {
                    nameSegment = nameParts.slice(0, i).join('/');

                    if (baseParts) {
                        //Find the longest baseName segment match in the config.
                        //So, do joins on the biggest to smallest lengths of baseParts.
                        for (j = baseParts.length; j > 0; j -= 1) {
                            mapValue = map[baseParts.slice(0, j).join('/')];

                            //baseName segment has config, find if it has one for
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

        function removeScript(name) {
            if (isBrowser) {
                each(scripts(), function (scriptNode) {
                    if (scriptNode.getAttribute('data-requiremodule') === name &&
                            scriptNode.getAttribute('data-requirecontext') === context.contextName) {
                        scriptNode.parentNode.removeChild(scriptNode);
                        return true;
                    }
                });
            }
        }

        function hasPathFallback(id) {
            var pathConfig = config.paths[id];
            if (pathConfig && isArray(pathConfig) && pathConfig.length > 1) {
                removeScript(id);
                //Pop off the first array value, since it failed, and
                //retry
                pathConfig.shift();
                context.undef(id);
                context.require([id]);
                return true;
            }
        }

        /**
         * Creates a module mapping that includes plugin prefix, module
         * name, and path. If parentModuleMap is provided it will
         * also normalize the name via require.normalize()
         *
         * @param {String} name the module name
         * @param {String} [parentModuleMap] parent module map
         * for the module name, used to resolve relative names.
         * @param {Boolean} isNormalized: is the ID already normalized.
         * This is true if this call is done for a define() module ID.
         * @param {Boolean} applyMap: apply the map config to the ID.
         * Should only be true if this map is for a dependency.
         *
         * @returns {Object}
         */
        function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
            var url, pluginModule, suffix,
                index = name ? name.indexOf('!') : -1,
                prefix = null,
                parentName = parentModuleMap ? parentModuleMap.name : null,
                originalName = name,
                isDefine = true,
                normalizedName = '';

            //If no name, then it means it is a require call, generate an
            //internal name.
            if (!name) {
                isDefine = false;
                name = '_@r' + (requireCounter += 1);
            }

            if (index !== -1) {
                prefix = name.substring(0, index);
                name = name.substring(index + 1, name.length);
            }

            if (prefix) {
                prefix = normalize(prefix, parentName, applyMap);
                pluginModule = defined[prefix];
            }

            //Account for relative paths if there is a base name.
            if (name) {
                if (prefix) {
                    if (pluginModule && pluginModule.normalize) {
                        //Plugin is loaded, use its normalize method.
                        normalizedName = pluginModule.normalize(name, function (name) {
                            return normalize(name, parentName, applyMap);
                        });
                    } else {
                        normalizedName = normalize(name, parentName, applyMap);
                    }
                } else {
                    //A regular module.
                    normalizedName = normalize(name, parentName, applyMap);
                    url = context.nameToUrl(normalizedName);
                }
            }

            //If the id is a plugin id that cannot be determined if it needs
            //normalization, stamp it with a unique ID so two matching relative
            //ids that may conflict can be separate.
            suffix = prefix && !pluginModule && !isNormalized ?
                     '_unnormalized' + (unnormalizedCounter += 1) :
                     '';

            return {
                prefix: prefix,
                name: normalizedName,
                parentMap: parentModuleMap,
                unnormalized: !!suffix,
                url: url,
                originalName: originalName,
                isDefine: isDefine,
                id: (prefix ?
                        prefix + '!' + normalizedName :
                        normalizedName) + suffix
            };
        }

        function getModule(depMap) {
            var id = depMap.id,
                mod = registry[id];

            if (!mod) {
                mod = registry[id] = new context.Module(depMap);
            }

            return mod;
        }

        function on(depMap, name, fn) {
            var id = depMap.id,
                mod = registry[id];

            if (hasProp(defined, id) &&
                    (!mod || mod.defineEmitComplete)) {
                if (name === 'defined') {
                    fn(defined[id]);
                }
            } else {
                getModule(depMap).on(name, fn);
            }
        }

        function onError(err, errback) {
            var ids = err.requireModules,
                notified = false;

            if (errback) {
                errback(err);
            } else {
                each(ids, function (id) {
                    var mod = registry[id];
                    if (mod) {
                        //Set error on module, so it skips timeout checks.
                        mod.error = err;
                        if (mod.events.error) {
                            notified = true;
                            mod.emit('error', err);
                        }
                    }
                });

                if (!notified) {
                    req.onError(err);
                }
            }
        }

        /**
         * Internal method to transfer globalQueue items to this context's
         * defQueue.
         */
        function takeGlobalQueue() {
            //Push all the globalDefQueue items into the context's defQueue
            if (globalDefQueue.length) {
                //Array splice in the values since the context code has a
                //local var ref to defQueue, so cannot just reassign the one
                //on context.
                apsp.apply(defQueue,
                           [defQueue.length - 1, 0].concat(globalDefQueue));
                globalDefQueue = [];
            }
        }

        /**
         * Helper function that creates a require function object to give to
         * modules that ask for it as a dependency. It needs to be specific
         * per module because of the implication of path mappings that may
         * need to be relative to the module name.
         */
        function makeRequire(mod, enableBuildCallback, altRequire) {
            var relMap = mod && mod.map,
                modRequire = makeContextModuleFunc(altRequire || context.require,
                                                   relMap,
                                                   enableBuildCallback);

            addRequireMethods(modRequire, context, relMap);
            modRequire.isBrowser = isBrowser;

            return modRequire;
        }

        handlers = {
            'require': function (mod) {
                return makeRequire(mod);
            },
            'exports': function (mod) {
                mod.usingExports = true;
                if (mod.map.isDefine) {
                    return (mod.exports = defined[mod.map.id] = {});
                }
            },
            'module': function (mod) {
                return (mod.module = {
                    id: mod.map.id,
                    uri: mod.map.url,
                    config: function () {
                        return (config.config && config.config[mod.map.id]) || {};
                    },
                    exports: defined[mod.map.id]
                });
            }
        };

        function removeWaiting(id) {
            //Clean up machinery used for waiting modules.
            delete registry[id];

            each(waitAry, function (mod, i) {
                if (mod.map.id === id) {
                    waitAry.splice(i, 1);
                    if (!mod.defined) {
                        context.waitCount -= 1;
                    }
                    return true;
                }
            });
        }

        function findCycle(mod, traced, processed) {
            var id = mod.map.id,
                depArray = mod.depMaps,
                foundModule;

            //Do not bother with unitialized modules or not yet enabled
            //modules.
            if (!mod.inited) {
                return;
            }

            //Found the cycle.
            if (traced[id]) {
                return mod;
            }

            traced[id] = true;

            //Trace through the dependencies.
            each(depArray, function (depMap) {
                var depId = depMap.id,
                    depMod = registry[depId];

                if (!depMod || processed[depId] ||
                        !depMod.inited || !depMod.enabled) {
                    return;
                }

                return (foundModule = findCycle(depMod, traced, processed));
            });

            processed[id] = true;

            return foundModule;
        }

        function forceExec(mod, traced, uninited) {
            var id = mod.map.id,
                depArray = mod.depMaps;

            if (!mod.inited || !mod.map.isDefine) {
                return;
            }

            if (traced[id]) {
                return defined[id];
            }

            traced[id] = mod;

            each(depArray, function (depMap) {
                var depId = depMap.id,
                    depMod = registry[depId],
                    value;

                if (handlers[depId]) {
                    return;
                }

                if (depMod) {
                    if (!depMod.inited || !depMod.enabled) {
                        //Dependency is not inited,
                        //so this module cannot be
                        //given a forced value yet.
                        uninited[id] = true;
                        return;
                    }

                    //Get the value for the current dependency
                    value = forceExec(depMod, traced, uninited);

                    //Even with forcing it may not be done,
                    //in particular if the module is waiting
                    //on a plugin resource.
                    if (!uninited[depId]) {
                        mod.defineDepById(depId, value);
                    }
                }
            });

            mod.check(true);

            return defined[id];
        }

        function modCheck(mod) {
            mod.check();
        }

        function checkLoaded() {
            var map, modId, err, usingPathFallback,
                waitInterval = config.waitSeconds * 1000,
                //It is possible to disable the wait interval by using waitSeconds of 0.
                expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(),
                noLoads = [],
                stillLoading = false,
                needCycleCheck = true;

            //Do not bother if this call was a result of a cycle break.
            if (inCheckLoaded) {
                return;
            }

            inCheckLoaded = true;

            //Figure out the state of all the modules.
            eachProp(registry, function (mod) {
                map = mod.map;
                modId = map.id;

                //Skip things that are not enabled or in error state.
                if (!mod.enabled) {
                    return;
                }

                if (!mod.error) {
                    //If the module should be executed, and it has not
                    //been inited and time is up, remember it.
                    if (!mod.inited && expired) {
                        if (hasPathFallback(modId)) {
                            usingPathFallback = true;
                            stillLoading = true;
                        } else {
                            noLoads.push(modId);
                            removeScript(modId);
                        }
                    } else if (!mod.inited && mod.fetched && map.isDefine) {
                        stillLoading = true;
                        if (!map.prefix) {
                            //No reason to keep looking for unfinished
                            //loading. If the only stillLoading is a
                            //plugin resource though, keep going,
                            //because it may be that a plugin resource
                            //is waiting on a non-plugin cycle.
                            return (needCycleCheck = false);
                        }
                    }
                }
            });

            if (expired && noLoads.length) {
                //If wait time expired, throw error of unloaded modules.
                err = makeError('timeout', 'Load timeout for modules: ' + noLoads, null, noLoads);
                err.contextName = context.contextName;
                return onError(err);
            }

            //Not expired, check for a cycle.
            if (needCycleCheck) {

                each(waitAry, function (mod) {
                    if (mod.defined) {
                        return;
                    }

                    var cycleMod = findCycle(mod, {}, {}),
                        traced = {};

                    if (cycleMod) {
                        forceExec(cycleMod, traced, {});

                        //traced modules may have been
                        //removed from the registry, but
                        //their listeners still need to
                        //be called.
                        eachProp(traced, modCheck);
                    }
                });

                //Now that dependencies have
                //been satisfied, trigger the
                //completion check that then
                //notifies listeners.
                eachProp(registry, modCheck);
            }

            //If still waiting on loads, and the waiting load is something
            //other than a plugin resource, or there are still outstanding
            //scripts, then just try back later.
            if ((!expired || usingPathFallback) && stillLoading) {
                //Something is still waiting to load. Wait for it, but only
                //if a timeout is not already in effect.
                if ((isBrowser || isWebWorker) && !checkLoadedTimeoutId) {
                    checkLoadedTimeoutId = setTimeout(function () {
                        checkLoadedTimeoutId = 0;
                        checkLoaded();
                    }, 50);
                }
            }

            inCheckLoaded = false;
        }

        Module = function (map) {
            this.events = undefEvents[map.id] || {};
            this.map = map;
            this.shim = config.shim[map.id];
            this.depExports = [];
            this.depMaps = [];
            this.depMatched = [];
            this.pluginMaps = {};
            this.depCount = 0;

            /* this.exports this.factory
               this.depMaps = [],
               this.enabled, this.fetched
            */
        };

        Module.prototype = {
            init: function (depMaps, factory, errback, options) {
                options = options || {};

                //Do not do more inits if already done. Can happen if there
                //are multiple define calls for the same module. That is not
                //a normal, common case, but it is also not unexpected.
                if (this.inited) {
                    return;
                }

                this.factory = factory;

                if (errback) {
                    //Register for errors on this module.
                    this.on('error', errback);
                } else if (this.events.error) {
                    //If no errback already, but there are error listeners
                    //on this module, set up an errback to pass to the deps.
                    errback = bind(this, function (err) {
                        this.emit('error', err);
                    });
                }

                //Do a copy of the dependency array, so that
                //source inputs are not modified. For example
                //"shim" deps are passed in here directly, and
                //doing a direct modification of the depMaps array
                //would affect that config.
                this.depMaps = depMaps && depMaps.slice(0);
                this.depMaps.rjsSkipMap = depMaps.rjsSkipMap;

                this.errback = errback;

                //Indicate this module has be initialized
                this.inited = true;

                this.ignore = options.ignore;

                //Could have option to init this module in enabled mode,
                //or could have been previously marked as enabled. However,
                //the dependencies are not known until init is called. So
                //if enabled previously, now trigger dependencies as enabled.
                if (options.enabled || this.enabled) {
                    //Enable this module and dependencies.
                    //Will call this.check()
                    this.enable();
                } else {
                    this.check();
                }
            },

            defineDepById: function (id, depExports) {
                var i;

                //Find the index for this dependency.
                each(this.depMaps, function (map, index) {
                    if (map.id === id) {
                        i = index;
                        return true;
                    }
                });

                return this.defineDep(i, depExports);
            },

            defineDep: function (i, depExports) {
                //Because of cycles, defined callback for a given
                //export can be called more than once.
                if (!this.depMatched[i]) {
                    this.depMatched[i] = true;
                    this.depCount -= 1;
                    this.depExports[i] = depExports;
                }
            },

            fetch: function () {
                if (this.fetched) {
                    return;
                }
                this.fetched = true;

                context.startTime = (new Date()).getTime();

                var map = this.map;

                //If the manager is for a plugin managed resource,
                //ask the plugin to load it now.
                if (this.shim) {
                    makeRequire(this, true)(this.shim.deps || [], bind(this, function () {
                        return map.prefix ? this.callPlugin() : this.load();
                    }));
                } else {
                    //Regular dependency.
                    return map.prefix ? this.callPlugin() : this.load();
                }
            },

            load: function () {
                var url = this.map.url;

                //Regular dependency.
                if (!urlFetched[url]) {
                    urlFetched[url] = true;
                    context.load(this.map.id, url);
                }
            },

            /**
             * Checks is the module is ready to define itself, and if so,
             * define it. If the silent argument is true, then it will just
             * define, but not notify listeners, and not ask for a context-wide
             * check of all loaded modules. That is useful for cycle breaking.
             */
            check: function (silent) {
                if (!this.enabled || this.enabling) {
                    return;
                }

                var err, cjsModule,
                    id = this.map.id,
                    depExports = this.depExports,
                    exports = this.exports,
                    factory = this.factory;

                if (!this.inited) {
                    this.fetch();
                } else if (this.error) {
                    this.emit('error', this.error);
                } else if (!this.defining) {
                    //The factory could trigger another require call
                    //that would result in checking this module to
                    //define itself again. If already in the process
                    //of doing that, skip this work.
                    this.defining = true;

                    if (this.depCount < 1 && !this.defined) {
                        if (isFunction(factory)) {
                            //If there is an error listener, favor passing
                            //to that instead of throwing an error.
                            if (this.events.error) {
                                try {
                                    exports = context.execCb(id, factory, depExports, exports);
                                } catch (e) {
                                    err = e;
                                }
                            } else {
                                exports = context.execCb(id, factory, depExports, exports);
                            }

                            if (this.map.isDefine) {
                                //If setting exports via 'module' is in play,
                                //favor that over return value and exports. After that,
                                //favor a non-undefined return value over exports use.
                                cjsModule = this.module;
                                if (cjsModule &&
                                        cjsModule.exports !== undefined &&
                                        //Make sure it is not already the exports value
                                        cjsModule.exports !== this.exports) {
                                    exports = cjsModule.exports;
                                } else if (exports === undefined && this.usingExports) {
                                    //exports already set the defined value.
                                    exports = this.exports;
                                }
                            }

                            if (err) {
                                err.requireMap = this.map;
                                err.requireModules = [this.map.id];
                                err.requireType = 'define';
                                return onError((this.error = err));
                            }

                        } else {
                            //Just a literal value
                            exports = factory;
                        }

                        this.exports = exports;

                        if (this.map.isDefine && !this.ignore) {
                            defined[id] = exports;

                            if (req.onResourceLoad) {
                                req.onResourceLoad(context, this.map, this.depMaps);
                            }
                        }

                        //Clean up
                        delete registry[id];

                        this.defined = true;
                        context.waitCount -= 1;
                        if (context.waitCount === 0) {
                            //Clear the wait array used for cycles.
                            waitAry = [];
                        }
                    }

                    //Finished the define stage. Allow calling check again
                    //to allow define notifications below in the case of a
                    //cycle.
                    this.defining = false;

                    if (!silent) {
                        if (this.defined && !this.defineEmitted) {
                            this.defineEmitted = true;
                            this.emit('defined', this.exports);
                            this.defineEmitComplete = true;
                        }
                    }
                }
            },

            callPlugin: function () {
                var map = this.map,
                    id = map.id,
                    pluginMap = makeModuleMap(map.prefix, null, false, true);

                on(pluginMap, 'defined', bind(this, function (plugin) {
                    var load, normalizedMap, normalizedMod,
                        name = this.map.name,
                        parentName = this.map.parentMap ? this.map.parentMap.name : null;

                    //If current map is not normalized, wait for that
                    //normalized name to load instead of continuing.
                    if (this.map.unnormalized) {
                        //Normalize the ID if the plugin allows it.
                        if (plugin.normalize) {
                            name = plugin.normalize(name, function (name) {
                                return normalize(name, parentName, true);
                            }) || '';
                        }

                        normalizedMap = makeModuleMap(map.prefix + '!' + name,
                                                      this.map.parentMap,
                                                      false,
                                                      true);
                        on(normalizedMap,
                            'defined', bind(this, function (value) {
                                this.init([], function () { return value; }, null, {
                                    enabled: true,
                                    ignore: true
                                });
                            }));
                        normalizedMod = registry[normalizedMap.id];
                        if (normalizedMod) {
                            if (this.events.error) {
                                normalizedMod.on('error', bind(this, function (err) {
                                    this.emit('error', err);
                                }));
                            }
                            normalizedMod.enable();
                        }

                        return;
                    }

                    load = bind(this, function (value) {
                        this.init([], function () { return value; }, null, {
                            enabled: true
                        });
                    });

                    load.error = bind(this, function (err) {
                        this.inited = true;
                        this.error = err;
                        err.requireModules = [id];

                        //Remove temp unnormalized modules for this module,
                        //since they will never be resolved otherwise now.
                        eachProp(registry, function (mod) {
                            if (mod.map.id.indexOf(id + '_unnormalized') === 0) {
                                removeWaiting(mod.map.id);
                            }
                        });

                        onError(err);
                    });

                    //Allow plugins to load other code without having to know the
                    //context or how to 'complete' the load.
                    load.fromText = function (moduleName, text) {
                        /*jslint evil: true */
                        var hasInteractive = useInteractive;

                        //Turn off interactive script matching for IE for any define
                        //calls in the text, then turn it back on at the end.
                        if (hasInteractive) {
                            useInteractive = false;
                        }

                        //Prime the system by creating a module instance for
                        //it.
                        getModule(makeModuleMap(moduleName));

                        req.exec(text);

                        if (hasInteractive) {
                            useInteractive = true;
                        }

                        //Support anonymous modules.
                        context.completeLoad(moduleName);
                    };

                    //Use parentName here since the plugin's name is not reliable,
                    //could be some weird string with no path that actually wants to
                    //reference the parentName's path.
                    plugin.load(map.name, makeRequire(map.parentMap, true, function (deps, cb, er) {
                        deps.rjsSkipMap = true;
                        return context.require(deps, cb, er);
                    }), load, config);
                }));

                context.enable(pluginMap, this);
                this.pluginMaps[pluginMap.id] = pluginMap;
            },

            enable: function () {
                this.enabled = true;

                if (!this.waitPushed) {
                    waitAry.push(this);
                    context.waitCount += 1;
                    this.waitPushed = true;
                }

                //Set flag mentioning that the module is enabling,
                //so that immediate calls to the defined callbacks
                //for dependencies do not trigger inadvertent load
                //with the depCount still being zero.
                this.enabling = true;

                //Enable each dependency
                each(this.depMaps, bind(this, function (depMap, i) {
                    var id, mod, handler;

                    if (typeof depMap === 'string') {
                        //Dependency needs to be converted to a depMap
                        //and wired up to this module.
                        depMap = makeModuleMap(depMap,
                                               (this.map.isDefine ? this.map : this.map.parentMap),
                                               false,
                                               !this.depMaps.rjsSkipMap);
                        this.depMaps[i] = depMap;

                        handler = handlers[depMap.id];

                        if (handler) {
                            this.depExports[i] = handler(this);
                            return;
                        }

                        this.depCount += 1;

                        on(depMap, 'defined', bind(this, function (depExports) {
                            this.defineDep(i, depExports);
                            this.check();
                        }));

                        if (this.errback) {
                            on(depMap, 'error', this.errback);
                        }
                    }

                    id = depMap.id;
                    mod = registry[id];

                    //Skip special modules like 'require', 'exports', 'module'
                    //Also, don't call enable if it is already enabled,
                    //important in circular dependency cases.
                    if (!handlers[id] && mod && !mod.enabled) {
                        context.enable(depMap, this);
                    }
                }));

                //Enable each plugin that is used in
                //a dependency
                eachProp(this.pluginMaps, bind(this, function (pluginMap) {
                    var mod = registry[pluginMap.id];
                    if (mod && !mod.enabled) {
                        context.enable(pluginMap, this);
                    }
                }));

                this.enabling = false;

                this.check();
            },

            on: function (name, cb) {
                var cbs = this.events[name];
                if (!cbs) {
                    cbs = this.events[name] = [];
                }
                cbs.push(cb);
            },

            emit: function (name, evt) {
                each(this.events[name], function (cb) {
                    cb(evt);
                });
                if (name === 'error') {
                    //Now that the error handler was triggered, remove
                    //the listeners, since this broken Module instance
                    //can stay around for a while in the registry/waitAry.
                    delete this.events[name];
                }
            }
        };

        function callGetModule(args) {
            getModule(makeModuleMap(args[0], null, true)).init(args[1], args[2]);
        }

        function removeListener(node, func, name, ieName) {
            //Favor detachEvent because of IE9
            //issue, see attachEvent/addEventListener comment elsewhere
            //in this file.
            if (node.detachEvent && !isOpera) {
                //Probably IE. If not it will throw an error, which will be
                //useful to know.
                if (ieName) {
                    node.detachEvent(ieName, func);
                }
            } else {
                node.removeEventListener(name, func, false);
            }
        }

        /**
         * Given an event from a script node, get the requirejs info from it,
         * and then removes the event listeners on the node.
         * @param {Event} evt
         * @returns {Object}
         */
        function getScriptData(evt) {
            //Using currentTarget instead of target for Firefox 2.0's sake. Not
            //all old browsers will be supported, but this one was easy enough
            //to support and still makes sense.
            var node = evt.currentTarget || evt.srcElement;

            //Remove the listeners once here.
            removeListener(node, context.onScriptLoad, 'load', 'onreadystatechange');
            removeListener(node, context.onScriptError, 'error');

            return {
                node: node,
                id: node && node.getAttribute('data-requiremodule')
            };
        }

        return (context = {
            config: config,
            contextName: contextName,
            registry: registry,
            defined: defined,
            urlFetched: urlFetched,
            waitCount: 0,
            defQueue: defQueue,
            Module: Module,
            makeModuleMap: makeModuleMap,

            /**
             * Set a configuration for the context.
             * @param {Object} cfg config object to integrate.
             */
            configure: function (cfg) {
                //Make sure the baseUrl ends in a slash.
                if (cfg.baseUrl) {
                    if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== '/') {
                        cfg.baseUrl += '/';
                    }
                }

                //Save off the paths and packages since they require special processing,
                //they are additive.
                var pkgs = config.pkgs,
                    shim = config.shim,
                    paths = config.paths,
                    map = config.map;

                //Mix in the config values, favoring the new values over
                //existing ones in context.config.
                mixin(config, cfg, true);

                //Merge paths.
                config.paths = mixin(paths, cfg.paths, true);

                //Merge map
                if (cfg.map) {
                    config.map = mixin(map || {}, cfg.map, true, true);
                }

                //Merge shim
                if (cfg.shim) {
                    eachProp(cfg.shim, function (value, id) {
                        //Normalize the structure
                        if (isArray(value)) {
                            value = {
                                deps: value
                            };
                        }
                        if (value.exports && !value.exports.__buildReady) {
                            value.exports = context.makeShimExports(value.exports);
                        }
                        shim[id] = value;
                    });
                    config.shim = shim;
                }

                //Adjust packages if necessary.
                if (cfg.packages) {
                    each(cfg.packages, function (pkgObj) {
                        var location;

                        pkgObj = typeof pkgObj === 'string' ? { name: pkgObj } : pkgObj;
                        location = pkgObj.location;

                        //Create a brand new object on pkgs, since currentPackages can
                        //be passed in again, and config.pkgs is the internal transformed
                        //state for all package configs.
                        pkgs[pkgObj.name] = {
                            name: pkgObj.name,
                            location: location || pkgObj.name,
                            //Remove leading dot in main, so main paths are normalized,
                            //and remove any trailing .js, since different package
                            //envs have different conventions: some use a module name,
                            //some use a file name.
                            main: (pkgObj.main || 'main')
                                  .replace(currDirRegExp, '')
                                  .replace(jsSuffixRegExp, '')
                        };
                    });

                    //Done with modifications, assing packages back to context config
                    config.pkgs = pkgs;
                }

                //If there are any "waiting to execute" modules in the registry,
                //update the maps for them, since their info, like URLs to load,
                //may have changed.
                eachProp(registry, function (mod, id) {
                    //If module already has init called, since it is too
                    //late to modify them, and ignore unnormalized ones
                    //since they are transient.
                    if (!mod.inited && !mod.map.unnormalized) {
                        mod.map = makeModuleMap(id);
                    }
                });

                //If a deps array or a config callback is specified, then call
                //require with those args. This is useful when require is defined as a
                //config object before require.js is loaded.
                if (cfg.deps || cfg.callback) {
                    context.require(cfg.deps || [], cfg.callback);
                }
            },

            makeShimExports: function (exports) {
                var func;
                if (typeof exports === 'string') {
                    func = function () {
                        return getGlobal(exports);
                    };
                    //Save the exports for use in nodefine checking.
                    func.exports = exports;
                    return func;
                } else {
                    return function () {
                        return exports.apply(global, arguments);
                    };
                }
            },

            requireDefined: function (id, relMap) {
                return hasProp(defined, makeModuleMap(id, relMap, false, true).id);
            },

            requireSpecified: function (id, relMap) {
                id = makeModuleMap(id, relMap, false, true).id;
                return hasProp(defined, id) || hasProp(registry, id);
            },

            require: function (deps, callback, errback, relMap) {
                var moduleName, id, map, requireMod, args;
                if (typeof deps === 'string') {
                    if (isFunction(callback)) {
                        //Invalid call
                        return onError(makeError('requireargs', 'Invalid require call'), errback);
                    }

                    //Synchronous access to one module. If require.get is
                    //available (as in the Node adapter), prefer that.
                    //In this case deps is the moduleName and callback is
                    //the relMap
                    if (req.get) {
                        return req.get(context, deps, callback);
                    }

                    //Just return the module wanted. In this scenario, the
                    //second arg (if passed) is just the relMap.
                    moduleName = deps;
                    relMap = callback;

                    //Normalize module name, if it contains . or ..
                    map = makeModuleMap(moduleName, relMap, false, true);
                    id = map.id;

                    if (!hasProp(defined, id)) {
                        return onError(makeError('notloaded', 'Module name "' +
                                    id +
                                    '" has not been loaded yet for context: ' +
                                    contextName));
                    }
                    return defined[id];
                }

                //Callback require. Normalize args. if callback or errback is
                //not a function, it means it is a relMap. Test errback first.
                if (errback && !isFunction(errback)) {
                    relMap = errback;
                    errback = undefined;
                }
                if (callback && !isFunction(callback)) {
                    relMap = callback;
                    callback = undefined;
                }

                //Any defined modules in the global queue, intake them now.
                takeGlobalQueue();

                //Make sure any remaining defQueue items get properly processed.
                while (defQueue.length) {
                    args = defQueue.shift();
                    if (args[0] === null) {
                        return onError(makeError('mismatch', 'Mismatched anonymous define() module: ' + args[args.length - 1]));
                    } else {
                        //args are id, deps, factory. Should be normalized by the
                        //define() function.
                        callGetModule(args);
                    }
                }

                //Mark all the dependencies as needing to be loaded.
                requireMod = getModule(makeModuleMap(null, relMap));

                requireMod.init(deps, callback, errback, {
                    enabled: true
                });

                checkLoaded();

                return context.require;
            },

            undef: function (id) {
                //Bind any waiting define() calls to this context,
                //fix for #408
                takeGlobalQueue();

                var map = makeModuleMap(id, null, true),
                    mod = registry[id];

                delete defined[id];
                delete urlFetched[map.url];
                delete undefEvents[id];

                if (mod) {
                    //Hold on to listeners in case the
                    //module will be attempted to be reloaded
                    //using a different config.
                    if (mod.events.defined) {
                        undefEvents[id] = mod.events;
                    }

                    removeWaiting(id);
                }
            },

            /**
             * Called to enable a module if it is still in the registry
             * awaiting enablement. parent module is passed in for context,
             * used by the optimizer.
             */
            enable: function (depMap, parent) {
                var mod = registry[depMap.id];
                if (mod) {
                    getModule(depMap).enable();
                }
            },

            /**
             * Internal method used by environment adapters to complete a load event.
             * A load event could be a script load or just a load pass from a synchronous
             * load call.
             * @param {String} moduleName the name of the module to potentially complete.
             */
            completeLoad: function (moduleName) {
                var found, args, mod,
                    shim = config.shim[moduleName] || {},
                    shExports = shim.exports && shim.exports.exports;

                takeGlobalQueue();

                while (defQueue.length) {
                    args = defQueue.shift();
                    if (args[0] === null) {
                        args[0] = moduleName;
                        //If already found an anonymous module and bound it
                        //to this name, then this is some other anon module
                        //waiting for its completeLoad to fire.
                        if (found) {
                            break;
                        }
                        found = true;
                    } else if (args[0] === moduleName) {
                        //Found matching define call for this script!
                        found = true;
                    }

                    callGetModule(args);
                }

                //Do this after the cycle of callGetModule in case the result
                //of those calls/init calls changes the registry.
                mod = registry[moduleName];

                if (!found && !defined[moduleName] && mod && !mod.inited) {
                    if (config.enforceDefine && (!shExports || !getGlobal(shExports))) {
                        if (hasPathFallback(moduleName)) {
                            return;
                        } else {
                            return onError(makeError('nodefine',
                                             'No define call for ' + moduleName,
                                             null,
                                             [moduleName]));
                        }
                    } else {
                        //A script that does not call define(), so just simulate
                        //the call for it.
                        callGetModule([moduleName, (shim.deps || []), shim.exports]);
                    }
                }

                checkLoaded();
            },

            /**
             * Converts a module name + .extension into an URL path.
             * *Requires* the use of a module name. It does not support using
             * plain URLs like nameToUrl.
             */
            toUrl: function (moduleNamePlusExt, relModuleMap) {
                var index = moduleNamePlusExt.lastIndexOf('.'),
                    ext = null;

                if (index !== -1) {
                    ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
                    moduleNamePlusExt = moduleNamePlusExt.substring(0, index);
                }

                return context.nameToUrl(normalize(moduleNamePlusExt, relModuleMap && relModuleMap.id, true),
                                         ext);
            },

            /**
             * Converts a module name to a file path. Supports cases where
             * moduleName may actually be just an URL.
             * Note that it **does not** call normalize on the moduleName,
             * it is assumed to have already been normalized. This is an
             * internal API, not a public one. Use toUrl for the public API.
             */
            nameToUrl: function (moduleName, ext) {
                var paths, pkgs, pkg, pkgPath, syms, i, parentModule, url,
                    parentPath;

                //If a colon is in the URL, it indicates a protocol is used and it is just
                //an URL to a file, or if it starts with a slash, contains a query arg (i.e. ?)
                //or ends with .js, then assume the user meant to use an url and not a module id.
                //The slash is important for protocol-less URLs as well as full paths.
                if (req.jsExtRegExp.test(moduleName)) {
                    //Just a plain path, not module name lookup, so just return it.
                    //Add extension if it is included. This is a bit wonky, only non-.js things pass
                    //an extension, this method probably needs to be reworked.
                    url = moduleName + (ext || '');
                } else {
                    //A module that needs to be converted to a path.
                    paths = config.paths;
                    pkgs = config.pkgs;

                    syms = moduleName.split('/');
                    //For each module name segment, see if there is a path
                    //registered for it. Start with most specific name
                    //and work up from it.
                    for (i = syms.length; i > 0; i -= 1) {
                        parentModule = syms.slice(0, i).join('/');
                        pkg = pkgs[parentModule];
                        parentPath = paths[parentModule];
                        if (parentPath) {
                            //If an array, it means there are a few choices,
                            //Choose the one that is desired
                            if (isArray(parentPath)) {
                                parentPath = parentPath[0];
                            }
                            syms.splice(0, i, parentPath);
                            break;
                        } else if (pkg) {
                            //If module name is just the package name, then looking
                            //for the main module.
                            if (moduleName === pkg.name) {
                                pkgPath = pkg.location + '/' + pkg.main;
                            } else {
                                pkgPath = pkg.location;
                            }
                            syms.splice(0, i, pkgPath);
                            break;
                        }
                    }

                    //Join the path parts together, then figure out if baseUrl is needed.
                    url = syms.join('/');
                    url += (ext || (/\?/.test(url) ? '' : '.js'));
                    url = (url.charAt(0) === '/' || url.match(/^[\w\+\.\-]+:/) ? '' : config.baseUrl) + url;
                }

                return config.urlArgs ? url +
                                        ((url.indexOf('?') === -1 ? '?' : '&') +
                                         config.urlArgs) : url;
            },

            //Delegates to req.load. Broken out as a separate function to
            //allow overriding in the optimizer.
            load: function (id, url) {
                req.load(context, id, url);
            },

            /**
             * Executes a module callack function. Broken out as a separate function
             * solely to allow the build system to sequence the files in the built
             * layer in the right sequence.
             *
             * @private
             */
            execCb: function (name, callback, args, exports) {
                return callback.apply(exports, args);
            },

            /**
             * callback for script loads, used to check status of loading.
             *
             * @param {Event} evt the event from the browser for the script
             * that was loaded.
             */
            onScriptLoad: function (evt) {
                //Using currentTarget instead of target for Firefox 2.0's sake. Not
                //all old browsers will be supported, but this one was easy enough
                //to support and still makes sense.
                if (evt.type === 'load' ||
                        (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
                    //Reset interactive script so a script node is not held onto for
                    //to long.
                    interactiveScript = null;

                    //Pull out the name of the module and the context.
                    var data = getScriptData(evt);
                    context.completeLoad(data.id);
                }
            },

            /**
             * Callback for script errors.
             */
            onScriptError: function (evt) {
                var data = getScriptData(evt);
                if (!hasPathFallback(data.id)) {
                    return onError(makeError('scripterror', 'Script error', evt, [data.id]));
                }
            }
        });
    }

    /**
     * Main entry point.
     *
     * If the only argument to require is a string, then the module that
     * is represented by that string is fetched for the appropriate context.
     *
     * If the first argument is an array, then it will be treated as an array
     * of dependency string names to fetch. An optional function callback can
     * be specified to execute when all of those dependencies are available.
     *
     * Make a local req variable to help Caja compliance (it assumes things
     * on a require that are not standardized), and to give a short
     * name for minification/local scope use.
     */
    req = requirejs = function (deps, callback, errback, optional) {

        //Find the right context, use default
        var context, config,
            contextName = defContextName;

        // Determine if have config object in the call.
        if (!isArray(deps) && typeof deps !== 'string') {
            // deps is a config object
            config = deps;
            if (isArray(callback)) {
                // Adjust args if there are dependencies
                deps = callback;
                callback = errback;
                errback = optional;
            } else {
                deps = [];
            }
        }

        if (config && config.context) {
            contextName = config.context;
        }

        context = contexts[contextName];
        if (!context) {
            context = contexts[contextName] = req.s.newContext(contextName);
        }

        if (config) {
            context.configure(config);
        }

        return context.require(deps, callback, errback);
    };

    /**
     * Support require.config() to make it easier to cooperate with other
     * AMD loaders on globally agreed names.
     */
    req.config = function (config) {
        return req(config);
    };

    /**
     * Export require as a global, but only if it does not already exist.
     */
    if (!require) {
        require = req;
    }

    req.version = version;

    //Used to filter out dependencies that are already paths.
    req.jsExtRegExp = /^\/|:|\?|\.js$/;
    req.isBrowser = isBrowser;
    s = req.s = {
        contexts: contexts,
        newContext: newContext
    };

    //Create default context.
    req({});

    //Exports some context-sensitive methods on global require, using
    //default context if no context specified.
    addRequireMethods(req);

    if (isBrowser) {
        head = s.head = document.getElementsByTagName('head')[0];
        //If BASE tag is in play, using appendChild is a problem for IE6.
        //When that browser dies, this can be removed. Details in this jQuery bug:
        //http://dev.jquery.com/ticket/2709
        baseElement = document.getElementsByTagName('base')[0];
        if (baseElement) {
            head = s.head = baseElement.parentNode;
        }
    }

    /**
     * Any errors that require explicitly generates will be passed to this
     * function. Intercept/override it if you want custom error handling.
     * @param {Error} err the error object.
     */
    req.onError = function (err) {
        throw err;
    };

    /**
     * Does the request to load a module for the browser case.
     * Make this a separate function to allow other environments
     * to override it.
     *
     * @param {Object} context the require context to find state.
     * @param {String} moduleName the name of the module.
     * @param {Object} url the URL to the module.
     */
    req.load = function (context, moduleName, url) {
        var config = (context && context.config) || {},
            node;
        if (isBrowser) {
            //In the browser so use a script tag
            node = config.xhtml ?
                    document.createElementNS('http://www.w3.org/1999/xhtml', 'html:script') :
                    document.createElement('script');
            node.type = config.scriptType || 'text/javascript';
            node.charset = 'utf-8';
            node.async = true;

            node.setAttribute('data-requirecontext', context.contextName);
            node.setAttribute('data-requiremodule', moduleName);

            //Set up load listener. Test attachEvent first because IE9 has
            //a subtle issue in its addEventListener and script onload firings
            //that do not match the behavior of all other browsers with
            //addEventListener support, which fire the onload event for a
            //script right after the script execution. See:
            //https://connect.microsoft.com/IE/feedback/details/648057/script-onload-event-is-not-fired-immediately-after-script-execution
            //UNFORTUNATELY Opera implements attachEvent but does not follow the script
            //script execution mode.
            if (node.attachEvent &&
                    //Check if node.attachEvent is artificially added by custom script or
                    //natively supported by browser
                    //read https://github.com/jrburke/requirejs/issues/187
                    //if we can NOT find [native code] then it must NOT natively supported.
                    //in IE8, node.attachEvent does not have toString()
                    //Note the test for "[native code" with no closing brace, see:
                    //https://github.com/jrburke/requirejs/issues/273
                    !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
                    !isOpera) {
                //Probably IE. IE (at least 6-8) do not fire
                //script onload right after executing the script, so
                //we cannot tie the anonymous define call to a name.
                //However, IE reports the script as being in 'interactive'
                //readyState at the time of the define call.
                useInteractive = true;

                node.attachEvent('onreadystatechange', context.onScriptLoad);
                //It would be great to add an error handler here to catch
                //404s in IE9+. However, onreadystatechange will fire before
                //the error handler, so that does not help. If addEvenListener
                //is used, then IE will fire error before load, but we cannot
                //use that pathway given the connect.microsoft.com issue
                //mentioned above about not doing the 'script execute,
                //then fire the script load event listener before execute
                //next script' that other browsers do.
                //Best hope: IE10 fixes the issues,
                //and then destroys all installs of IE 6-9.
                //node.attachEvent('onerror', context.onScriptError);
            } else {
                node.addEventListener('load', context.onScriptLoad, false);
                node.addEventListener('error', context.onScriptError, false);
            }
            node.src = url;

            //For some cache cases in IE 6-8, the script executes before the end
            //of the appendChild execution, so to tie an anonymous define
            //call to the module name (which is stored on the node), hold on
            //to a reference to this node, but clear after the DOM insertion.
            currentlyAddingScript = node;
            if (baseElement) {
                head.insertBefore(node, baseElement);
            } else {
                head.appendChild(node);
            }
            currentlyAddingScript = null;

            return node;
        } else if (isWebWorker) {
            //In a web worker, use importScripts. This is not a very
            //efficient use of importScripts, importScripts will block until
            //its script is downloaded and evaluated. However, if web workers
            //are in play, the expectation that a build has been done so that
            //only one script needs to be loaded anyway. This may need to be
            //reevaluated if other use cases become common.
            importScripts(url);

            //Account for anonymous modules
            context.completeLoad(moduleName);
        }
    };

    function getInteractiveScript() {
        if (interactiveScript && interactiveScript.readyState === 'interactive') {
            return interactiveScript;
        }

        eachReverse(scripts(), function (script) {
            if (script.readyState === 'interactive') {
                return (interactiveScript = script);
            }
        });
        return interactiveScript;
    }

    //Look for a data-main script attribute, which could also adjust the baseUrl.
    if (isBrowser) {
        //Figure out baseUrl. Get it from the script tag with require.js in it.
        eachReverse(scripts(), function (script) {
            //Set the 'head' where we can append children by
            //using the script's parent.
            if (!head) {
                head = script.parentNode;
            }

            //Look for a data-main attribute to set main script for the page
            //to load. If it is there, the path to data main becomes the
            //baseUrl, if it is not already set.
            dataMain = script.getAttribute('data-main');
            if (dataMain) {
                //Set final baseUrl if there is not already an explicit one.
                if (!cfg.baseUrl) {
                    //Pull off the directory of data-main for use as the
                    //baseUrl.
                    src = dataMain.split('/');
                    mainScript = src.pop();
                    subPath = src.length ? src.join('/')  + '/' : './';

                    cfg.baseUrl = subPath;
                    dataMain = mainScript;
                }

                //Strip off any trailing .js since dataMain is now
                //like a module name.
                dataMain = dataMain.replace(jsSuffixRegExp, '');

                //Put the data-main script in the files to load.
                cfg.deps = cfg.deps ? cfg.deps.concat(dataMain) : [dataMain];

                return true;
            }
        });
    }

    /**
     * The function that handles definitions of modules. Differs from
     * require() in that a string for the module should be the first argument,
     * and the function to execute after dependencies are loaded should
     * return a value to define the module corresponding to the first argument's
     * name.
     */
    define = function (name, deps, callback) {
        var node, context;

        //Allow for anonymous functions
        if (typeof name !== 'string') {
            //Adjust args appropriately
            callback = deps;
            deps = name;
            name = null;
        }

        //This module may not have dependencies
        if (!isArray(deps)) {
            callback = deps;
            deps = [];
        }

        //If no name, and callback is a function, then figure out if it a
        //CommonJS thing with dependencies.
        if (!deps.length && isFunction(callback)) {
            //Remove comments from the callback string,
            //look for require calls, and pull them into the dependencies,
            //but only if there are function args.
            if (callback.length) {
                callback
                    .toString()
                    .replace(commentRegExp, '')
                    .replace(cjsRequireRegExp, function (match, dep) {
                        deps.push(dep);
                    });

                //May be a CommonJS thing even without require calls, but still
                //could use exports, and module. Avoid doing exports and module
                //work though if it just needs require.
                //REQUIRES the function to expect the CommonJS variables in the
                //order listed below.
                deps = (callback.length === 1 ? ['require'] : ['require', 'exports', 'module']).concat(deps);
            }
        }

        //If in IE 6-8 and hit an anonymous define() call, do the interactive
        //work.
        if (useInteractive) {
            node = currentlyAddingScript || getInteractiveScript();
            if (node) {
                if (!name) {
                    name = node.getAttribute('data-requiremodule');
                }
                context = contexts[node.getAttribute('data-requirecontext')];
            }
        }

        //Always save off evaluating the def call until the script onload handler.
        //This allows multiple modules to be in a file without prematurely
        //tracing dependencies, and allows for anonymous module support,
        //where the module name is not known until the script onload event
        //occurs. If no context, use the global queue, and get it processed
        //in the onscript load callback.
        (context ? context.defQueue : globalDefQueue).push([name, deps, callback]);
    };

    define.amd = {
        jQuery: true
    };


    /**
     * Executes the text. Normally just uses eval, but can be modified
     * to use a better, environment-specific call. Only used for transpiling
     * loader plugins, not for plain JS modules.
     * @param {String} text the text to execute/evaluate.
     */
    req.exec = function (text) {
        /*jslint evil: true */
        return eval(text);
    };

    //Set up with config info.
    req(cfg);
}(this));

define("requireLib",[], function(){});

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
        boardNames = ['13', 'smiley', 'sq', 'house', 'dogman', 'rgbcmy',
                      'invaders'];

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
