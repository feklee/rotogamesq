-- Inserts the hiscore into the hiscores for the specified board, if there are
-- no duplicates (same name) with a lower number of rotations.
--
-- Afterwards, trims the number of the board's hiscores to the best seven.

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
