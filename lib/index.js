var Hoek = require('hoek');
var Pail = require('pail');
var Api = require('./api');
var Utils = require('./utils');

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
    var pail = new Pail(settings.reel);

    plugin.bind({
        api: api,
        pail: Pail,
        settings: settings
    });


    plugin.expose('settings', settings);
    plugin.expose('createReel', Api.createReel.bind(api));
    plugin.expose('getReel', Api.getReel.bind(api));
    plugin.expose('startReel', Api.startReel.bind(api));
    plugin.expose('deleteReel', Api.deleteReel.bind(api));
    plugin.expose('getReels', Api.getReels.bind(api));
    plugin.expose('cancelReel', Api.cancelReel.bind(api));

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
