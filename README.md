Introduction
============

ROTOGAMEsq is a variant of [Roto Game][1] with *squared tiles*: The [author][4]
has moved, and in his new home the [bathroom tiles][15] are different. ;-)

**Play:** [sq.rotogame.com][2]

**Install:** [Firefox Marketplace][12]

**Hack:** [GitHub][13]


History
=======

ROTOGAMEsq has originally been written from scratch for the 2012
[js13kGames][3] challenge. The version that has been submitted to the challenge
is tagged (GIT): `js13kgames`


How to start development environment
====================================

 1. Bring dependencies up to date:

        npm update

 2. Set environment variables:
      + `REDIS_HOST` (optional, default: `127.0.0.1`)
      + `REDIS_PORT` (optional, default: `6379`)
      + `REDIS_PASSWORD` (optional)
      + `AMAZON_VERIFICATION_KEY` (optional)
      + `NODE_ENV`: `development`

 3. Run directly:

        node app.js

    Or with [nodemon][5] (on Windows specifiying `-L` may be necessary):

        nodemon --watch . app.js


Open Web App
============

ROTOGAMEsq supports installation as [Open Web App][11]. Once installed, it can
be run offline. To test installation, open the relative URL:

    /install-webapp

The manifest is located at:

    /manifest.webapp


How to add a board
==================

 1. Add the tiles for the start and end to: `public/images/boards_sprites.png`

 2. Add the description to: `app/common/config.js`

    Limit board names to eight alphanumeric characters, even though they are
    flexible: Any string that goes as a Redis key should work.


User interface
==============

  * Portrait and landscape layouts: To give optimal user experience espcially
    on mobile devices, the game adapts the layout depending on whether the
    browser's viewport is in landscape (width > height) or portrait mode.

  * Undo/redo is accessible by standard keyboard shortcuts: Ctrl-Z / Command-Z,
    Ctrl-Y / Shift-Command-Y


Hiscores
========

  * The hiscores for each board are stored in a Redis database.

  * On the server, every hiscore entry is tested for plausibility (do the
    rotations really solve a board). This prevents cheating by forging client
    server communication.

  * With every hiscore entry, rotations are stored, which makes it possible to
    manually investigate some of the more astonishing solutions.

  * [localStorage][6] is used for offline capability:

      + On client load (communication via [Socket.IO][7], automatically repeated
        until connection is available):

          - hiscores are retrieved from localStorage,

          - updated hiscores are requested from the server,

          - unsaved hiscores are sent to server.

      + On new hiscores on server: new saved hiscores broadcasted to all
        clients

      + On new hiscore entry on client: unsaved hiscores sent to server

  * Hiscores may be inspected via the Redis CLI:

      + To show hiscores of board `smiley`:

            ZRANGE smiley 0 -1 WITHSCORES

      + To show rotations associated with hiscores for board  `smiley`:

            HGETALL smiley.rotations

      + To list all boards with recorded rotations (= all boards with
        hiscores):

            KEYS *.rotations


Coordinates
===========

Variable name postfixes of coordinates and dimensions denote units:

  * `T`: multiples of tiles (*tile coordinates*)

  * `P`: percentage

  * *no postfix:* pixels


Hard coded values
=================

In various places the following values are assumed:

  * Maximum number of rotations: 99

  * Maximum number of hiscores per board: 7

  * Maximum number of characters in name in hiscores: 8


Releasing a new version
=======================

  * Version number schema: major.minor.bugfix

  * Update `version` in: `package.json`

  * Add tag in GIT.


Hacking notes
=============

  * `Object.freeze` is not used due to Android 2.3's native browser not
    supporting it.

  * Tiles are rendered to `canvas`. This may look cumbersome: Can't tiles be
    rendered simply as squared `div` tags? They can. However, in major browser
    `div` tags cannot be positioned with sub pixel accuracy (as of September
    2012). In these browsers, positions are rounded to pixels and the result is
    irregular spacing, e.g.: one spacing 2px, another one 3px

    For similar reasons (possible subpixel positioning issues), the rotation is
    *not* done using CSS3 transformations.

  * Format for comments: [Mardown][10]

  * The current `README.md` has some ugly formatting of lists, to work around
    [a bug][9] in GitHub's Markdown interpreter.

  * Browsers to test on, as of November 2012: Firefox, Chrome, Opera, Android
    2.3 browser, iOS Safari, Firefox OS


Contributors
============

  * Maria Morillas: boards *ebunny* (easter bunny), *pumpkin,* *mushroom,* and
    *santa* all copyright 2013 and licensed under a
    [Creative Commons Attribution 3.0 Spain License][14].


Legal
=====

Copyright 2012—13 [Felix E. Klee][4],

Licensed under the Apache License, Version 2.0 (the “License”); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an “AS IS” BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.


[1]: http://code.google.com/p/rotogame
[2]: http://sq.rotogame.com
[3]: http://js13kgames.com
[4]: mailto:felix.klee@inka.de
[5]: https://github.com/remy/nodemon
[6]: http://www.w3.org/TR/webstorage/#the-localstorage-attribute
[7]: http://socket.io/
[8]: http://www.whatwg.org/specs/web-apps/current-work/multipage/offline.html#appcache
[9]: https://github.com/github/markup/issues/165
[10]: http://daringfireball.net/projects/markdown/
[11]: https://developer.mozilla.org/en-US/docs/Apps
[12]: https://marketplace.firefox.com/app/rotogamesq/
[13]: https://github.com/feklee/rotogamesq
[14]: http://creativecommons.org/licenses/by/3.0/es/
[15]: https://blog.mozilla.org/apps/2013/11/19/q-a-rotogamesq/
