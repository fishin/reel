var Runner = require('./runner');
var Pail = require('pail');
var Path = require('path');

var internals = {};

module.exports = internals.Utils = function (options) {

    internals.Utils.settings = options;
    this.createRun = exports.createRun;
    this.startRun = exports.startRun;
    this.cancelRun = exports.cancelRun;
    this.getRun = exports.getRun;
    this.getRunByLink = exports.getRunByLink;
    internals.Utils.getRunPids = exports.getRunPids;
    this.getRunPids = exports.getRunPids;
    this.getRuns = exports.getRuns;
    this.deleteRun = exports.deleteRun;
    this.getWorkspaceArtifact = exports.getWorkspaceArtifact;
    this.deleteWorkspace = exports.deleteWorkspace;
};

exports.createRun = function (cmds) {

   var commands = internals.buildCommandArray(cmds); 
   var config = {
       commands: commands,
       status: 'created'
   };
   var pail = new Pail(internals.Utils.settings.reel);
   var result = pail.createPail(config);
   pail.createWorkspace(result.id);
   return result;
};

exports.startRun = function (runId) {

   // execute job from id and give back status, elapsed time, reel id, need to pass optional timeout
   console.log('starting run: ' + runId);
   var runner = new Runner(internals.Utils.settings);
   //console.log(reeler);
   var result = runner.start(runId);
   return result;
};

exports.cancelRun = function (runId) {

   // how should i interrupt a job?
   // need to check elapsed time after it has been successfully stopped
   var pail = new Pail(internals.Utils.settings.reel);
   var config = pail.getPail(runId);
   // need to actually cancel the job here
   var pids = internals.Utils.getRunPids(runId);
   for (var i = 0; i < pids.length; i++) {
      console.log('killing pids: ' + pids[i]);
      process.kill(pids[i]);
   }
   config.status = 'cancelled';
   var pail = new Pail(internals.Utils.settings.reel);
   pail.updatePail(config);
   return config;
};

exports.getRun = function (runId) {

    var pail = new Pail(internals.Utils.settings.reel);
    var config = pail.getPail(runId);
    if (config.finishTime) {
        config.elapsedTime = config.finishTime - config.startTime;
    }
    return config;
};

exports.getRunByLink = function (link) {

    var pail = new Pail(internals.Utils.settings.reel);
    var pailId = pail.getPailByLink(link);
    if (pailId) {
        var config = pail.getPail(pailId);
        return config;
    }
    else {
        return null;
    }
};

exports.getRunPids = function (runId) {

    var runner = new Runner(internals.Utils.settings);
    var pids = runner.getPids(runId);
    return pids;
};

exports.getRuns = function () {

   var pail = new Pail(internals.Utils.settings.reel);
   var reels = pail.getPails();
   return reels;
};

exports.deleteRun = function (runId) {

   var pail = new Pail(internals.Utils.settings.reel);
   pail.deletePail(runId);
   return null;
};

exports.deleteWorkspace = function () {

   var pail = new Pail(internals.Utils.settings.reel);
   pail.deleteWorkspace();
   return null;
};

exports.getWorkspaceArtifact = function (artifact) {

   var pail = new Pail(internals.Utils.settings.reel);
   //console.log('getting artifact: ' + artifact);
   var contents = pail.getWorkspaceArtifact(artifact);
   return contents;
};

internals.buildCommandArray = function(cmds) {

   var commands = [];
   for (var i = 0; i < cmds.length; i++) {

      // parallel commands
      if (typeof cmds[i] === 'object' ) {
          var parallelCommands = [];
          for (var j = 0; j < cmds[i].length; j++) {

              var cmdObj = { command: cmds[i][j] };
              parallelCommands.push(cmdObj);
          }
          commands.push(parallelCommands);
      }
      // serial commands
      else {
          var cmdObj = { command: cmds[i] };
          commands.push(cmdObj);
      }
   }
   return commands;
}
