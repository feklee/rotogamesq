Introduction
============

ROTOGAMEsq is a variant of [Roto Game][1] with *squared tiles*: The [author][6]
has moved, and in his new home the bathroom tiles are different. ;-)

ROTOGAMEsq has been written from scratch for the [js13kGames][2] challenge
2012. It is based on ECMAScript 5 and HTML5. The version that has been
submitted to the challenge is tagged (GIT): `js13kgames`

Hiscores are kept in the browser's local storage.


Installation
============

 1. Optionally set environment variables:
 
      * `REDIS_HOST` (default: `127.0.0.1`)
      
      * `REDIS_PORT` (default: `6379`)

 2. Run: `node server.js`


User interface
==============

  * Portrait and landscape layouts: To give optimal user experience espcially
    on mobile devices, the game adapts the layout depending on whether the
    browser's viewport is in landscape (width > height) or portrait mode.

  * Undo/redo is accessible by standard keyboard shortcuts: Ctrl-Z / Command-Z,
    Ctrl-Y / Shift-Command-Y


Development notes
=================

  * Variable name postfixes of coordinates and dimensions denote units:
  
      - `T`: multiples of tiles (*tile coordinates*)
      
      - `P`: percentage

      - *no postfix:* pixels

  * `Object.freeze` is not used due to Android 2.3's native browser not
    supporting it.
  
  * Tiles are rendered to `canvas`. This may look cumbersome: Can't tiles be
    rendered simply as `div` tags? They can. However, in major browser `div`
    tags cannot be positioned with sub pixel accuracy (as of September 2012).
    In these browsers, positions are rounded to pixels and the result is
    irregular spacing, e.g.: one spacing 2px, another one 3px
    
    For similar reasons (possible subpixel positioning issues), the rotation is
    *not* done using CSS3 transformations.

  * Version number schema: major.minor.bugfix

  * Numeric assumptions made in various parts of the code (hard coded):
  
      - Maximum number of rotations: 99

      - Maximum number of hiscores per board: 7

Legal
=====

Copyright 2012 [Felix E. Klee][6]

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.


[1]: http://code.google.com/p/rotogame/
[2]: http://js13kgames.com/
[3]: http://closure-compiler.appspot.com/home
[4]: http://kangax.github.com/html-minifier/
[5]: http://www.cssoptimiser.com
[6]: mailto:felix.klee@inka.de
