var Reeler = require('./reeler');
var Reel = require('./reel');
var Pail = require('pail');
var Hoek = require('hoek');
var Path = require('path');


module.exports = function (options) {

    this.settings = options;
};

module.exports.createReel = function (request, reply) {

   var reel = new Reel(this.settings);
   var result = reel.createReel(request.payload.commands);  
   reply(result);
};

module.exports.startReel = function (request, reply) {

   var reel = new Reel(this.settings);
   var result = reel.startReel(request.params.id);
   reply(result);
};

module.exports.cancelReel = function (request, reply) {
   
   var reel = new Reel(this.settings);
   var result = reel.cancelReel(request.params.id);
   reply(result);
};

module.exports.getReel = function (request, reply) {

   var reel = new Reel(this.settings);
   var result = reel.getReel(request.params.id);
   reply(result);
};

module.exports.getReels = function (request, reply) {

   var reel = new Reel(this.settings);
   var result = reel.getReels();
   reply(result);
};

module.exports.deleteReel = function (request, reply) {

   var reel = new Reel(this.settings);
   var result = reel.deleteReel(request.params.id);
   reply(result);
};
