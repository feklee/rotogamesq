Introduction
============

ROTOGAMEsq is a variant of [Roto Game][1] with squared tiles: The [author][6]
has moved, and in his new home there now are squared bathroom tiles. ;-)

ROTOGAMEsq has been written from scratch for the [JS13KGames][2] challenge.


Installation
============

Serve `index.html` with UTF-8 encoding.


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


JS13KGames
==========

To prepare code for JS13KGames:

 1. Copy relevant assets into: `js13kgames`

 2. Create new build:
 
        $ node r.js -o client.build.js

 3. Open `client.build/vendor/almond.js` and compile it using
    [Closure Compiler Service][3] with *Simple Optimizations*.
 
 4. Save the compilation results to: `js13kgames/client/game.js`

 5. Change in `js13kgames/index.html`:
 
        <script data-main="client/game" src="client/vendor/require.js"></script>

    To:

        <script src="client/game.js"></script>

 6. Minimize CSS, using [CSS Optimizer][4].

 7. Minimize HTML, using [HTML Minifier][5].
 
 8. Zip `js13kgames`, on Windows XP, using: *Send To* / *Compressed (zipped)
    Folder* (produces less bytes than WinRar's ZIP)


Legal
=====

Copyright 2012 [Felix E. Klee][4]

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
[4]: http://www.cssoptimiser.com
[5]: http://kangax.github.com/html-minifier/
[6]: mailto:felix.klee@inka.de
