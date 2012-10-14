// Copyright 2012 Felix E. Klee <felix.klee@inka.de>

// http://www.apache.org/licenses/LICENSE-2.0

var boards=[],boardFactory=require("./board_factory"),boardNames=require("fs").readdirSync("./boards"),emitHiscores;boardNames.forEach(function(e){boards.push(boardFactory.loadSync(e))}),Object.defineProperties(boards,{emitHiscores:{value:function(e){this.forEach(function(t){t.emitHiscores(e)})}},listen:{value:function(e){this.forEach(function(t){t.listen(e)})}}}),module.exports=boards