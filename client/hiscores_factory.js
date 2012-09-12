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
        lastNameSet = ''; // last name edited (preset for new proposals)

    function loadJson(url, onSuccess, onFailure) {
        var req = new XMLHttpRequest();

        req.onreadystatechange = function () {
            if (req.readyState === 4) {
                if (req.status === 200) {
                    onSuccess(req.responseText);
                } else {
                    // no error message shown, as usually the browser informs
                    // about failed GETs
                    onFailure();
                }
            }
        };
        req.open("GET", url + '?' + Date.now(), true);
        req.send();
    }

    function proposalIsBetterOrEqual(proposal, hiscore) {
        return proposal !== null && proposal.nRotations <= hiscore.nRotations;
    }

    function keepHiscoresLengthInBounds(rawHiscores) {
        rawHiscores.length = Math.min(rawHiscores.length, maxLength);
    }

    // Inserts proposal into hiscore:
    //
    //   * if it has sufficiently small number of rotations,
    //
    //   * and if name is not empty,
    //
    //   * and if there are no duplicates (same name) with a lower number of
    //     rotations.
    function insertProposal(rawHiscores, proposal) {
        var i, hiscore, proposalHasBeenInserted = false;

        if (proposal.name !== '') {
            if (rawHiscores.length === 0) {
                // hiscores empty => just insert
                rawHiscores.push(proposal);
                return;
            }

            for (i = 0; i < rawHiscores.length; i += 1) {
                hiscore = rawHiscores[i];

                if (proposal.name === hiscore.name &&
                        proposal.nRotations >= hiscore.nRotations) {
                    return; // duplicate with lower/same number of rotations
                }

                if (proposal.nRotations <= hiscore.nRotations &&
                        !proposalHasBeenInserted) {
                    rawHiscores.splice(i, 0, proposal);
                    proposalHasBeenInserted = true;
                } else if (proposal.name === hiscore.name) {
                    rawHiscores.splice(i, 1); // duplicate that is not better
                }
            }
        }

        keepHiscoresLengthInBounds(rawHiscores); // done at the end (in case
                                              // duplicates have been removed)
    }

    // `rawHiscores`: raw internal hiscores data
    function create(rawHiscores) {
        var proposal = null; // new, proposed hiscore (editable)

        return Object.create(null, {
            // Calls callback with two parameters: hiscore, index, and whether
            // the hiscore is editable (only appears once)
            forEach: {value: function (callback) {
                var i, hiscore,
                    maxI = rawHiscores.length,
                    proposalHasBeenShown = false;

                if (maxI === 0 && proposal !== null) {
                    // hiscore empty & proposal available => just show proposal
                    callback(proposal, 0, true);
                    return;
                }

                for (i = 0; i < maxI; i += 1) {
                    hiscore = rawHiscores[i];
                    if (proposalIsBetterOrEqual(proposal, hiscore) &&
                            !proposalHasBeenShown) {
                        callback(proposal, i, true);
                        i -= 1; // repeat current hiscore in next run
                        maxI = Math.min(maxI, maxLength - 1);
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
                // fixme: send to server, or explain here and in README.md that
                // things are not saved to server.

                if (proposal !== null) {
                    insertProposal(rawHiscores, proposal);
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
        });
    }

    return Object.create(null, {
        load: {value: function (hiscoresUrl, onLoaded) {
            loadJson(hiscoresUrl, function (json) {
                onLoaded(create(JSON.parse(json)));
            }, function () {
                onLoaded(create([])); // hiscores data couldn't be retrieved
            });
        }}
    });
});
