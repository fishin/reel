var Hoek = require('hoek');
var Joi = require('joi');
var Pail = require('pail');
var Api = require('./api');
var Utils = require('./utils');

var internals = {
    defaults: {
        apiPath: '/api',
        config: 'config.json',
        workspace: 'workspace',
        dirpath: '/tmp/reel'
    }
};

exports.register = function (server, options, next) {

    var settings = Hoek.applyToDefaults(internals.defaults, options);
    var api = new Api(settings);
    var pail = new Pail(settings);
    var utils = new Utils(settings);

    server.bind({
        api: api,
        pail: Pail,
        settings: settings,
        utils: utils
    });


    server.expose('settings', settings);
    server.expose('createRun', utils.createRun);
    server.expose('getRun', utils.getRun);
    server.expose('getRunByLink', utils.getRunByLink);
    server.expose('getRunPids', utils.getRunPids);
    server.expose('startRun', utils.startRun);
    server.expose('deleteRun', utils.deleteRun);
    server.expose('getRuns', utils.getRuns);
    server.expose('cancelRun', utils.cancelRun);
    server.expose('getWorkspaceArtifact', utils.getWorkspaceArtifact);
    server.expose('deleteWorkspace', utils.deleteWorkspace);

    server.route([
        {
            method: 'POST',
            path: settings.apiPath+'/run',
            config: {
                handler: Api.createRun,
                description: "create run",
                validate: {
                    payload: {
                        commands: Joi.array().includes(
                            Joi.string(),
                            Joi.array().includes(
                                Joi.string()
                            )
                        ).required()
                    }
                }
            }
        },
        {
            method: 'GET',
            path: settings.apiPath+'/run/{runId}',
            config: {
                handler: Api.getRun,
                description: "get run",
                validate: {
                    params: {
                        runId: Joi.string().guid().required()
                    }
                }
            }
        },
        {
            method: 'GET',
            path: settings.apiPath+'/run/bylink/{link}',
            config: {
                handler: Api.getRunByLink,
                description: "get run bylink",
                validate: {
                    params: {
                        link: Joi.string().required()
                    }
                }
            }
        },
        {
            method: 'GET',
            path: settings.apiPath+'/run/{runId}/start',
            config: {
                handler: Api.startRun,
                description: "start run",
                validate: {
                    params: {
                        runId: Joi.string().guid().required()
                    }
                }
            }
        },
        {
            method: 'DELETE',
            path: settings.apiPath+'/run/{runId}',
            config: {
                handler: Api.deleteRun,
                description: "delete run",
                validate: {
                    params: {
                        runId: Joi.string().guid().required()
                    }
                }
            }
        },
        {
            method: 'DELETE',
            path: settings.apiPath+'/run/workspace',
            config: {
                handler: Api.deleteWorkspace,
                description: "delete workspace"
            }
        },
        {
            method: 'GET',
            path: settings.apiPath+'/run/{runId}/cancel',
            config: {
                handler: Api.cancelRun,
                description: "cancel run",
                validate: {
                    params: {
                        runId: Joi.string().guid().required()
                    }
                }
            }
        },
        {
            method: 'GET',
            path: settings.apiPath+'/run/{runId}/pids',
            config: {
                handler: Api.getRunPids,
                description: "get pids",
                validate: {
                    params: {
                        runId: Joi.string().guid().required()
                    }
                }
            }
        },
        {
            method: 'GET',
            path: settings.apiPath+'/runs',
            config: {
                handler: Api.getRuns,
                description: "get runs"
            }
        }
    ]);

    next();
};

exports.register.attributes = {

    pkg: require('../package.json')
};
