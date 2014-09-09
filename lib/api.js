var Reeler = require('./reeler');
var Pail = require('pail').pail;
var Hoek = require('hoek');
var Fs = require('fs');
var Path = require('path');

var internals = {
    defaults: {
        apiPath: '/api',
        reelPath: '/tmp/reel',
        workspace: 'workspace'
    }
};

exports.createReel = function (request, reply) {
   
   var commands = [];
   for (var i = 0; i < request.payload.commands.length; i++) {

      if (typeof request.payload.commands[i] === 'object' ) {

          var parallelCommands = [];
          for (var j = 0; j < request.payload.commands[i].length; j++) {

              var cmdObj = { command: request.payload.commands[i][j] };
              parallelCommands.push(cmdObj);
          }
          commands.push(parallelCommands);
      }
      else {
          var cmdObj = { command: request.payload.commands[i] };
          commands.push(cmdObj);
      }
   }
   var config = {
       commands: commands,
       status: 'created'
   };
   var result = Pail.savePail(internals.defaults.reelPath, config);
   Fs.mkdirSync(internals.defaults.reelPath + '/' + result.id + '/' + internals.defaults.workspace);
   reply(result);
};

exports.startReel = function (request, reply) {

   // execute job from id and give back status, elapsed time, reel id, need to pass optional timeout
   console.log('starting reel: ' + request.params.id);
   var result = Reeler.start(request.params.id);
   reply( result );
};

exports.cancelReel = function (request, reply) {

   // how should i interrupt a job?
   // need to check elapsed time after it has been successfully stopped
   var config = Pail.getPail(internals.defaults.reelPath, request.params.id);
   // need to actually cancel the job here
   console.log('need to implement cancel');
   config.status = 'cancelled';
   Pail.savePail(internals.defaults.reelPath, config);
   reply(config);
};

exports.getReel = function (request, reply) {

    var config = Pail.getPail(internals.defaults.reelPath, request.params.id);
    if (config.finishTime) {
        config.elapsedTime = config.finishTime - request.params.id;
    }
    reply(config);
};

exports.getReels = function (request, reply) {

   var reels = Pail.getPails(internals.defaults.reelPath);
   reply(reels);
};

exports.deleteReel = function (request, reply) {

   var deleteDir = internals.defaults.reelPath + '/' + request.params.id + '/' + internals.defaults.workspace;
   internals.deleteWorkspace(deleteDir);
   Pail.deletePail(internals.defaults.reelPath, request.params.id);
   reply('deleted');
};

internals.deleteWorkspace = function(dir) {

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
            internals.deleteWorkspace(filename);
        }
        else {
           // rm filename
           //if (filename.match('^/tmp/node-ci')) {
               Fs.unlinkSync(filename);
           //}
        }
    }
    //if (dir.match('^/tmp/node-ci')) {
        Fs.rmdirSync(dir);
    //}
};
