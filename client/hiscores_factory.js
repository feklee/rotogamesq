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

define(function () {
    // fixme: remove, if unused

    'use strict';

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

    function insertProposal(hiscores, proposal) {
        var i, hiscore;

        for (i = 0; i < hiscores.length; i += 1) {
            hiscore = hiscores[i];
            if (proposalIsBetterOrEqual(proposal, hiscore)) {
                hiscores.splice(i, 0, proposal);
                return; // insert was successful
            }
        }
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
                    if (proposal !== undefined) {
                        name = name.substring(0, this.maxNameLen);
                        proposal.name = name;
                        lastNameSet = name;
                    }
                }},

                saveProposal: {value: function () {
                    // fixme: send to server

                    insertProposal(hiscores, proposal);
                    proposal = null;
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
