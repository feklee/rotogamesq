-- Inserts the hiscore into the hiscores for the specified board, if there are
-- no duplicates (same name) with a lower number of rotations.
--
-- Afterwards, trims the number of the board's hiscores to the best seven.

-- Copyright 2012 Felix E. Klee <felix.klee@inka.de>
--
-- Licensed under the Apache License, Version 2.0 (the "License"); you may not
-- use this file except in compliance with the License. You may obtain a copy
-- of the License at
--
-- http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
-- WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
-- License for the specific language governing permissions and limitations
-- under the License.

local score = ARGV[1]
local name = ARGV[2]

redis.call('zadd', KEYS[1], score, name)
