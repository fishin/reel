var Runner = require('./runner');
var Pail = require('pail');
var Hoek = require('hoek');
var Path = require('path');


module.exports = function (options) {

    this.settings = options;
    this.createRun = exports.createRun;
    this.startRun = exports.startRun;
    this.cancelRun = exports.cancelRun;
    this.getRun = exports.getRun;
    this.getRunPid = exports.getRunPid;
    this.getRuns = exports.getRuns;
    this.deleteRun = exports.deleteRun;
};

exports.createRun = function (cmds) {
   
   var commands = [];
   for (var i = 0; i < cmds.length; i++) {

      if (typeof cmds[i] === 'object' ) {

          var parallelCommands = [];
          for (var j = 0; j < cmds[i].length; j++) {

              var cmdObj = { command: cmds[i][j] };
              parallelCommands.push(cmdObj);
          }
          commands.push(parallelCommands);
      }
      else {
          var cmdObj = { command: cmds[i] };
          commands.push(cmdObj);
      }
   }
   var config = {
       commands: commands,
       status: 'created'
   };
   var pail = new Pail(this.settings.reel);
   //console.log(this);
   //console.log('pail:' + JSON.stringify(this));
   var result = pail.createPail(config);
   pail.createWorkspace(result.id);
   return result;
};

exports.startRun = function (run_id) {

   // execute job from id and give back status, elapsed time, reel id, need to pass optional timeout
   console.log('starting run: ' + run_id);
   var runner = new Runner(this.settings);
   //console.log(reeler);
   var result = runner.start(run_id);
   return result;
};

exports.cancelRun = function (run_id) {

   // how should i interrupt a job?
   // need to check elapsed time after it has been successfully stopped
   var pail = new Pail(this.settings.reel);
   var config = pail.getPail(run_id);
   // need to actually cancel the job here
   console.log('need to implement cancel');
   var pid = parseInt(this.getRunPid(run_id));
   console.log('killing pid: ' + pid);
   console.log(typeof pid);
   process.kill(pid);
   config.status = 'cancelled';
   var pail = new Pail(this.settings.reel);
   pail.updatePail(config);
   return config;
};

exports.getRun = function (run_id) {

    var pail = new Pail(this.settings.reel);
    var config = pail.getPail(run_id);
    if (config.finishTime) {
        config.elapsedTime = config.finishTime - config.startTime;
    }
    return config;
};

exports.getRunPid = function (run_id) {

    var runner = new Runner(this.settings);
    var pid = runner.getPid(run_id);
    return pid;
};

exports.getRuns = function () {

   var pail = new Pail(this.settings.reel);
   var reels = pail.getPails();
   return reels;
};

exports.deleteRun = function (run_id) {

   var pail = new Pail(this.settings.reel);
   pail.deleteWorkspace(run_id);
   pail.deletePail(run_id);
   return null;
};
