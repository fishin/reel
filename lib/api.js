var Reeler = require('./reeler');
var Pail = require('pail');
var Hoek = require('hoek');
var Fs = require('fs');
var Path = require('path');

var internals = {
    defaults: {
        apiPath: '/api',
        pail: {
            pailPath: '/tmp/reel',
            workspace: 'workspace',
            configFile: 'config.json'
        }
    }
};


module.exports = internals.Api = function (options) {

    var settings = Hoek.applyToDefaults(internals.defaults, options);
    //console.log(settings);
    this.settings = settings;
//    this.createReel = exports.createReel;
//    this.startReel = exports.startReel;
//    this.deleteReel = exports.deleteReel;
//    this.getReel = exports.getReel;
//    this.getReels = exports.getReels;
//    this.cancelReel = exports.cancelReel;
};

module.exports.createReel = function (request, reply) {
   
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
   var pail = new Pail(this.settings.pail);
   //console.log(this);
   //console.log('pail:' + JSON.stringify(this));
   var result = pail.savePail(config);
   reply(result);
};

module.exports.startReel = function (request, reply) {

   // execute job from id and give back status, elapsed time, reel id, need to pass optional timeout
   console.log('starting reel: ' + request.params.id);
   var result = Reeler.start(request.params.id);
   reply( result );
};

module.exports.cancelReel = function (request, reply) {

   // how should i interrupt a job?
   // need to check elapsed time after it has been successfully stopped
   var pail = new Pail(this.settings.pail);
   var config = pail.getPail(request.params.id);
   // need to actually cancel the job here
   console.log('need to implement cancel');
   config.status = 'cancelled';
   var pail = new Pail(this.settings.pail);
   pail.savePail(config);
   reply(config);
};

module.exports.getReel = function (request, reply) {

    var pail = new Pail(this.settings.pail);
    var config = pail.getPail(request.params.id);
    if (config.finishTime) {
        config.elapsedTime = config.finishTime - request.params.id;
    }
    reply(config);
};

module.exports.getReels = function (request, reply) {

    var pail = new Pail(this.settings.pail);
   var reels = pail.getPails();
   reply(reels);
};

module.exports.deleteReel = function (request, reply) {

    var pail = new Pail(this.settings.pail);
   pail.deletePail(request.params.id);
   reply('deleted');
};
