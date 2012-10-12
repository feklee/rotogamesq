-- Returns hiscores for a board, with names and scores used for ranking within
-- Redis sorted lists.

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

local names = redis.call('zrange', KEYS[1], 0, 7)

local namesWithScore = {}
for i,name in ipairs(names) do
   local score = redis.call('zscore', KEYS[1], name)
   table.insert(namesWithScore, {name, score})
end

print('--')
print(KEYS[1])
for i,nameWithScore in ipairs(namesWithScore) do
   print(nameWithScore[1]) -- fixme
end

return namesWithScore

-- for i=1,10 do
-- fixme for i,name in ipairs(names) do
-- fixme   local score = redis.call('zscore', KEYS[1], 'werw')
-- table.insert(namesWithScore, {'werw2', 5})
-- fixme   local score = redis.call('zscore', KEYS[1], tostring(name))
-- fixme   table.insert(namesWithScore, {tostring(name), score})
-- end

-- return {{'werw3', 5}, {'werw3', 5}, {'werw3', 5}} // fixme
