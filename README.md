Introduction
============

ROTOGAMEsq is a variant of [Roto Game][1] with squared tiles. There is no code
shared, however.

Why a new Roto Game? Because: The [original author][2] has moved, and in his
new home there are squared bathroom tiles.


Development notes
=================

  * Variable postfixes of coordinates and dimensions denote units:
  
      - `T`: multiples of tiles (*tile coordinates*)
      
      - `P`: percentage

      - *no postfix:* pixels

  * `Object.freeze` is not used due to Android 2.3's browser not supporting it.
  
  * Tiles are rendered to `canvas`. This may look cumbersome: Can't tiles be
    rendered simply as `div` tags? They can. However, in major browser `div`
    tags cannot be positioned with sub pixel accuracy (as of September 2012).
    In these browsers, positions are rounded to pixels and the result is uneven
    spacing, e.g.: one spacing 2px, another one 3px
    
    For similar reasons (possible subpixel positioning issues), the rotation is
    *not* done using CSS3 transformations.


Legal
=====

Copyright 2012 [Felix E. Klee][2]

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.


[1]: http://code.google.com/p/rotogame/
[2]: mailto:felix.klee@inka.de
