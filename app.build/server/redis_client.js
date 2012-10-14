// Copyright 2012 Felix E. Klee <felix.klee@inka.de>

// http://www.apache.org/licenses/LICENSE-2.0

var port=process.env.REDIS_PORT||6379,host=process.env.REDIS_HOST||"127.0.0.1",redisClient=require("redis").createClient(port,host);redisClient.on("error",function(e){console.error(e)}),module.exports=redisClient