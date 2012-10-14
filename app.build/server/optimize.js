// Copyright 2012 Felix E. Klee <felix.klee@inka.de>

// http://www.apache.org/licenses/LICENSE-2.0

var requirejs=require("requirejs"),config={appDir:"app",baseUrl:"client",dir:"app.build",modules:[{name:"game",include:["vendor/almond"],insertRequire:["game"]}],removeCombined:!0,wrap:!0};module.exports=function(e){requirejs.optimize(config,function(){e()})}