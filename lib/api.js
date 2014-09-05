var Reeler = require('./reeler');
var Fs = require('fs');
var Store = require('./store/file');

exports.createReel = function (request, reply) {

   var config = {
       commands: request.payload.commands,
       created: new Date().getTime()
   };
   var result = Store.saveReelConfig(config);
   /*
   if (result.err) {
       //Boom.badRequest(result.err);
       reply(result);
   }
   else {
       reply(result);
   }
   */
   reply(result);
};

exports.startReel = function (request, reply) {

   // execute job from id and give back status, elapsed time, reel id, need to pass optional timeout
   var result = Reeler.start(request.params.reel_id);
   reply( result );
};

exports.cancelReel = function (request, reply) {

   // how should i interrupt a job?
   // need to check elapsed time after it has been successfully stopped
   var config = Store.getReelConfig(request.params.reel_id);
   // need to actually cancel the job here
   console.log('need to implement cancel');
   config.status = 'cancelled';
   config.finishTime = new Date().getTime();
   Store.saveReelConfig(request.params.reel_id);
   reply(config);
};

/*
exports.getConsole = function (request, reply) {

    var file = Store.getConsoleLog(request.params.reel_id);
    var response = {
        reel_id: request.params.reel_id,
        console: file
    }
    reply(response);
};
*/

exports.getReel = function (request, reply) {

    var config = Store.getReelConfig(request.params.reel_id);
    if (config.finishTime) {
        config.elapsedTime = config.finishTime - request.params.reel_id;
    }
    reply(config);
};

exports.getReels = function (request, reply) {

   var reels = Store.getReels();
   reply(reels);
};

exports.deleteReel = function (request, reply) {

   Store.deleteReel(request.params.reel_id);
   reply('deleted');
};
