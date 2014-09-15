var Hoek = require('hoek');
var Api = require('./api');
var Reel = require('./reel');
var Pail = require('pail');

var internals = {
    defaults: {
        apiPath: '/api',
        reel: {
            pailPath: '/tmp/reel',
            workspace: 'workspace',
            configFile: 'config.json'
        }
    }
};

exports.register = function (plugin, options, next) {

    var settings = Hoek.applyToDefaults(internals.defaults, options);
    var api = new Api(settings);
    var reel = new Reel(settings);
    var pail = new Pail(settings.reel);

    plugin.bind({
        settings: settings,
        pail: Pail
    });

    plugin.expose('settings', settings);
    plugin.expose('createReel', reel.createReel.bind(reel));
    plugin.expose('getReel', reel.getReel.bind(reel));
    plugin.expose('startReel', reel.startReel.bind(reel));
    plugin.expose('deleteReel', reel.deleteReel.bind(reel));
    plugin.expose('getReels', reel.getReels.bind(reel));
    plugin.expose('cancelReel', reel.cancelReel.bind(reel));

    plugin.route([
        { method: 'POST', path: settings.apiPath+'/reel', config: { handler: Api.createReel, description: "reel commands" } },
        { method: 'GET', path: settings.apiPath+'/reel/{id}', config: { handler: Api.getReel, description: "get reel" } },
        { method: 'GET', path: settings.apiPath+'/reel/{id}/run', config: { handler: Api.startReel, description: "run reel" } },
        { method: 'DELETE', path: settings.apiPath+'/reel/{id}', config: { handler: Api.deleteReel, description: "delete reel" } },
        { method: 'GET', path: settings.apiPath+'/reels', config: { handler: Api.getReels, description: "get reels" } },
        { method: 'GET', path: settings.apiPath+'/reel/{id}/cancel', config: { handler: Api.cancelReel, description: "cancel reel" } }
    ]);

    next();
};

exports.register.attributes = {

    pkg: require('../package.json')
};
