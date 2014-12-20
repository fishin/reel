var Runner = require('./runner');
var Utils = require('./utils');
var Pail = require('pail');
var Hoek = require('hoek');
var Path = require('path');


module.exports = function (options) {

    this.settings = options;
};

module.exports.createRun = function (request, reply) {

   var utils = new Utils(this.settings);
   var result = utils.createRun(request.payload.commands);  
   reply(result);
};

module.exports.startRun = function (request, reply) {

   var utils = new Utils(this.settings);
   var result = utils.startRun(request.params.runId);
   reply(result);
};

module.exports.cancelRun = function (request, reply) {
   
   var utils = new Utils(this.settings);
   var result = utils.cancelRun(request.params.runId);
   reply(result);
};

module.exports.getRun = function (request, reply) {

   var utils = new Utils(this.settings);
   var result = utils.getRun(request.params.runId);
   reply(result);
};

module.exports.getRunByLink = function (request, reply) {

   var utils = new Utils(this.settings);
   var result = utils.getRunByLink(request.params.link);
   reply(result);
};

module.exports.getRunPids = function (request, reply) {

   var utils = new Utils(this.settings);
   var result = utils.getRunPids(request.params.runId);
   reply(result);
};

module.exports.getRuns = function (request, reply) {

   var utils = new Utils(this.settings);
   var result = utils.getRuns();
   reply(result);
};

module.exports.deleteRun = function (request, reply) {

   var utils = new Utils(this.settings);
   var result = utils.deleteRun(request.params.runId);
   reply(result);
};
