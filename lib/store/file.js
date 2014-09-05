var Fs = require('fs');
var Path = require('path');
var Uuid = require('node-uuid');

var internals = {
    defaults: {
        reelFile: 'config.json',
        consoleFile: 'console.log',
        mainPath: '/tmp',
        reelPath: 'reel',
        workspacePath: 'workspace' 
    }
};

internals.mkdirp = function (dirpath) {
  
  var parts = dirpath.split('/');
  for ( var i = 2; i <= parts.length; i++ ) {

    var dir = parts.slice(0, i).join('/');
    if ( ! Fs.existsSync(dir) ) {
       
            //console.log('making dir: ' + dir);
        	Fs.mkdirSync ( dir );
    }
  }
}

internals.rmdirFull = function(dir) {
	// works but makes me nervous, want to maybe do a validation here so it doesnt get too far away from me
	// in many cases I can be careful, but not sure how to safely remove all of scm dir for example
	// get advice from backer
	// for now just pretend via comment
	// definitely want joi validation to make sure we have valid strings etc
    var list = Fs.readdirSync(dir);
    for(var i = 0; i < list.length; i++) {

        var filename = Path.join(dir, list[i]);
        var stat = Fs.lstatSync(filename);
//        if (filename == "." || filename == "..") {
            // pass these files
//        }
//        else if (stat.isDirectory()) {
        if (stat.isDirectory()) {

            // rmdir recursively
            internals.rmdirFull(filename);
        }
        else {
           // rm filename
           //if (filename.match('^/tmp/node-ci')) {
               //console.log('removing file: ' + filename);
               Fs.unlinkSync(filename);
           //}
        }
    }
    //if (dir.match('^/tmp/node-ci')) {
        //onsole.log('removing dir: ' + dir);
        Fs.rmdirSync(dir);
    //}
};

exports.getDirs = function (dirpath) {

    var list = Fs.readdirSync(dirpath);
    var dirs = [];
    for(var i = 0; i < list.length; i++) {

        var filename = Path.join(dirpath, list[i]);
        var stat = Fs.lstatSync(filename);
        if (stat.isDirectory()) {
            var path = filename.split('/');
	    var dir = path[path.length-1];
            dirs.push(dir);
        }
        else {
           // skip because its a file
        }
    }
    return dirs;
};

exports.getReels = function () {

    var reelPath = internals.defaults.mainPath + '/' + internals.defaults.reelPath;
    var reels = this.getDirs(reelPath);
    return reels;
};

exports.saveReelConfig = function (config) {

   if (!config.reel_id) {
       config.reel_id = Uuid.v4();
   }
   var reelPath = internals.defaults.mainPath + '/' + internals.defaults.reelPath + '/' + config.reel_id;
   internals.mkdirp(reelPath);
   var reelFile = reelPath + '/' + internals.defaults.reelFile;
   if (config.status === 'succeeded' || config.status === 'failed' || config.status === 'aborted') {
       config.finishTime = new Date().getTime();
   }
   Fs.writeFileSync(reelFile, JSON.stringify(config,null,4));
   return config;
};

exports.getReelConfig = function (reel_id) {

   var reelPath = internals.defaults.mainPath + '/' + internals.defaults.reelPath + '/' + reel_id;
   var reelFile = reelPath + '/' + internals.defaults.reelFile;
   var config = Fs.readFileSync(reelFile, "utf8");
   return JSON.parse(config);
};

exports.deleteReel = function (reel_id) {

   var reelPath = internals.defaults.mainPath + '/' + internals.defaults.reelPath + '/' + reel_id;
   internals.rmdirFull(reelPath);
};
/*
exports.saveConsoleLog = function (reel_id, output) {

   var reelPath = internals.defaults.mainPath + '/' + internals.defaults.reelPath + '/' + reel_id;
   var consoleFile = reelPath + '/' + internals.defaults.consoleFile;
   Fs.appendFileSync(consoleFile, output, 'utf8');
};

exports.getConsoleLog = function (reel_id) {

   var reelPath = internals.defaults.mainPath + '/' + internals.defaults.reelPath + '/' + reel_id;
   var consoleFile = reelPath + '/' + internals.defaults.consoleFile;
   var file = Fs.readFileSync(consoleFile, 'utf8');
   return file;
};
*/
