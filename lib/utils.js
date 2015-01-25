var Child = require('child_process');
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
    this.getRunByName = exports.getRunByName;
    internals.Utils.getRunPids = exports.getRunPids;
    this.getRunPids = exports.getRunPids;
    this.getRuns = exports.getRuns;
    this.runCommand = exports.runCommand;
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
   var pail = new Pail(internals.Utils.settings);
   var result = pail.createPail(config);
   pail.createDir(internals.Utils.settings.workspace);
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
   var pail = new Pail(internals.Utils.settings);
   var config = pail.getPail(runId);
   // need to actually cancel the job here
   var pids = internals.Utils.getRunPids(runId);
   for (var i = 0; i < pids.length; i++) {
      console.log('killing pids: ' + pids[i]);
      process.kill(pids[i]);
   }
   config.status = 'cancelled';
   var pail = new Pail(internals.Utils.settings);
   pail.updatePail(config);
   return config;
};

exports.getRun = function (runId) {

    var pail = new Pail(internals.Utils.settings);
    var config = pail.getPail(runId);
    if (config.finishTime) {
        config.elapsedTime = config.finishTime - config.startTime;
    }
    return config;
};

exports.getRunByName = function (name) {

    var pail = new Pail(internals.Utils.settings);
    var pailId = pail.getPailByName(name);
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

   var pail = new Pail(internals.Utils.settings);
   var reels = pail.getPails();
   return reels;
};

exports.deleteRun = function (runId) {

   var pail = new Pail(internals.Utils.settings);
   pail.deletePail(runId);
   return null;
};

exports.deleteWorkspace = function () {

   var pail = new Pail(internals.Utils.settings);
   pail.deleteDir(internals.Utils.settings.workspace);
   return null;
};

exports.getWorkspaceArtifact = function (artifact) {

   var pail = new Pail(internals.Utils.settings);
   //console.log('getting artifact: ' + artifact);
   var contents = pail.getArtifact(internals.Utils.settings.workspace, artifact);
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
};

exports.runCommand = function(cmd, callback) {

    var result = {};
    result.stderr = '';
    result.stdout = '';
    result.startTime = new Date().getTime();
    var command = internals.splitCommand(cmd);
    var subProcess = Child.spawn.apply(Child.spawn, [ command.cmd, command.args ]);
    result.pid = subProcess.pid;
    console.log('running command "' + cmd + '" with pid ' + result.pid);
    // capture stdout and stderr
    subProcess.stdout.on('data', function (data) {

        result.stdout += data.toString();
    });

    subProcess.stderr.on('data', function (data) {

        result.stderr += data.toString();
    });

    subProcess.on('error', function (err) {

        result.finishTime = new Date().getTime();
        result.status = 'failed';
        result.error = err.toString();
        return callback(result);
    });

    subProcess.on('exit', function (code, signal) {

        if (result.stderr) {
            result.status = 'failed';
        } else {
            result.status = 'succeeded';
        }
        result.finishTime = new Date().getTime();
        result.code = code;
        result.signal = signal;
        return callback(result);
    });
};

internals.splitCommand = function(cmd) {
  
    var parts = cmd.split(" ");
    var mainCommand = parts[0];
    var args = [];
    for (var i = 1; i < parts.length; i++) {
         args.push(parts[i]);
    }
    return { cmd: mainCommand, args: args };
};
