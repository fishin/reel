var Hoek = require('hoek');
var Pail = require('pail');
var Api = require('./api');
var Utils = require('./utils');

var internals = {
    defaults: {
        apiPath: '/api',
        reel: {
            dirpath: '/tmp/reel',
            workspace: 'workspace',
            configFile: 'config.json'
        }
    }
};

exports.register = function (plugin, options, next) {

    var settings = Hoek.applyToDefaults(internals.defaults, options);
    var api = new Api(settings);
    var pail = new Pail(settings.reel);
    var utils = new Utils(settings);

    plugin.bind({
        api: api,
        pail: Pail,
        settings: settings,
        utils: utils
    });


    plugin.expose('settings', settings);
    plugin.expose('createRun', utils.createRun);
    plugin.expose('getRun', utils.getRun);
    plugin.expose('getRunByLink', utils.getRunByLink);
    plugin.expose('getRunPid', utils.getRunPid);
    plugin.expose('startRun', utils.startRun);
    plugin.expose('deleteRun', utils.deleteRun);
    plugin.expose('getRuns', utils.getRuns);
    plugin.expose('cancelRun', utils.cancelRun);

    plugin.route([
        { method: 'POST', path: settings.apiPath+'/run', config: { handler: Api.createRun, description: "create run" } },
        { method: 'GET', path: settings.apiPath+'/run/{run_id}', config: { handler: Api.getRun, description: "get run" } },
        { method: 'GET', path: settings.apiPath+'/run/bylink/{link}', config: { handler: Api.getRunByLink, description: "get runby link" } },
        { method: 'GET', path: settings.apiPath+'/run/{run_id}/start', config: { handler: Api.startRun, description: "start run" } },
        { method: 'DELETE', path: settings.apiPath+'/run/{run_id}', config: { handler: Api.deleteRun, description: "delete run" } },
        { method: 'GET', path: settings.apiPath+'/run/{run_id}/cancel', config: { handler: Api.cancelRun, description: "cancel run" } },
        { method: 'GET', path: settings.apiPath+'/run/{run_id}/pid', config: { handler: Api.getRunPid, description: "get pid" } },
        { method: 'GET', path: settings.apiPath+'/runs', config: { handler: Api.getRuns, description: "get runs" } },
    ]);

    next();
};

exports.register.attributes = {

    pkg: require('../package.json')
};
