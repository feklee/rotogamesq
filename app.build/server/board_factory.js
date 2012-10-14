// Copyright 2012 Felix E. Klee <felix.klee@inka.de>

// http://www.apache.org/licenses/LICENSE-2.0

var hiscoresFactory=require("./hiscores_factory"),loadSync=function(e){var t=hiscoresFactory.create(e);return Object.create(null,{name:{get:function(){return e}},listen:{value:t.listen},emitHiscores:{value:t.emit}})};module.exports=Object.create(null,{loadSync:{value:loadSync}})