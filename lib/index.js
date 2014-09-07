var Hapi = require('hapi');
var Hoek = require('hoek');
var Joi = require('joi');
var Api = require('./api');

var internals = {
    defaults: {
        api: {
            basePath: '/api'
        }
    }
};

exports.register = function (plugin, options, next) {

    var settings = Hoek.applyToDefaults(internals.defaults, options);

    plugin.route([
        { method: 'POST', path: settings.api.basePath+'/reel', config: { handler: Api.createReel, description: "reel commands" } },
        { method: 'GET', path: settings.api.basePath+'/reel/{id}', config: { handler: Api.getReel, description: "get reel" } },
        { method: 'GET', path: settings.api.basePath+'/reel/{id}/run', config: { handler: Api.startReel, description: "run reel" } },
        { method: 'DELETE', path: settings.api.basePath+'/reel/{id}', config: { handler: Api.deleteReel, description: "delete reel" } },
        { method: 'GET', path: settings.api.basePath+'/reels', config: { handler: Api.getReels, description: "get reels" } },
        { method: 'GET', path: settings.api.basePath+'/reel/{id}/cancel', config: { handler: Api.cancelReel, description: "cancel reel" } }
    ]);

    next();
};

exports.register.attributes = {

    pkg: require('../package.json')
};
