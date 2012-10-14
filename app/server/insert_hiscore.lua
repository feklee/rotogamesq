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

local key = KEYS[1]
local rotationsKey = key .. ".rotations"
local score = ARGV[1]
local name = ARGV[2]
local rotationsJson = ARGV[3]
local existingScore = redis.call('zscore', key, name)

-- Inserts name with score, if it doesn't exist yet or if score is better:
if (not existingScore) or tonumber(score) < tonumber(existingScore) then
   redis.call('zadd', key, score, name)
   redis.call('hset', rotationsKey, name, rotationsJson)
end

-- Limits size of elements to a maximum of seven:
local namesToDel = redis.call('zrange', key, 7, -1)
for i,nameToDel in ipairs(namesToDel) do
   redis.call('hdel', rotationsKey, nameToDel)
end
redis.call('zremrangebyrank', key, 7, -1)
