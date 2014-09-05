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
           // rm fiilename
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
//        if (filename == "." || filename == "..") {
            // pass these files
//        }
//        else if (stat.isSymbolicLink()) {
        if (stat.isSymbolicLink()) {
            // rmdir recursively
            // we don't care about symlinks
            //console.log('symlink: ' + filename);
        }
        else if (stat.isDirectory()) {
            // rmdir recursively
            //console.log('job: ' + filename);
            var path = filename.split('/');
	          var dir = path[path.length-1];
            dirs.push(dir);
        }
        else {
           // we dont care about files
           //console.log('filename: ' + filename);
        }
    }
    //console.log('jobs: ', jobs);
    return dirs;
};

exports.getReels = function (job_id) {

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

exports.setReelLabel = function (reel_id, label) {

	var reelPath = internals.defaults.mainPath + '/' + internals.defaults.reelPath;
	var reelIdPath = reelPath + '/' + reel_id;
	var labelPath = reelPath + '/' + label;
	if (Fs.existsSync(labelPath)) {
        Fs.unlinkSync(labelPath);
        Fs.symlinkSync(reelIdPath, labelPath);
	}
	else {
        Fs.symlinkSync(reelIdPath, labelPath);
	}
};

exports.getReelByLabel = function (label) {
	var reelPath = internals.defaults.mainPath + '/' +  internals.defaults.reelPath;
	var reelIdPath = reelPath + '/' + reel_id;
	var labelPath = reelPath + '/' + label;
	if (Fs.existsSync(labelPath)) {
	    var namePath = Fs.readlinkSync(labelPath);
	    var reel = namePath.split('/');
	    var reel_id = reel[reel.length-1];
	    return reel_id;
	} 
	else {
		return null;
	}
};

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
