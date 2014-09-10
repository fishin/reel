var Hoek = require('hoek');
var Api = require('./api');

exports.register = function (plugin, options, next) {

    var api = new Api(options);
    //console.log(api.settings);
    plugin.bind({
        api: api.settings
    });

    plugin.expose('settings', api.settings);
    plugin.expose('createReel', Api.createReel.bind(api));
    plugin.expose('getReel', Api.getReel.bind(api));
    plugin.expose('startReel', Api.startReel.bind(api));
    plugin.expose('deleteReel', Api.deleteReel.bind(api));
    plugin.expose('getReels', Api.getReels.bind(api));
    plugin.expose('cancelReel', Api.cancelReel.bind(api));

    plugin.route([
        { method: 'POST', path: api.settings.apiPath+'/reel', config: { handler: Api.createReel, description: "reel commands" } },
        { method: 'GET', path: api.settings.apiPath+'/reel/{id}', config: { handler: Api.getReel, description: "get reel" } },
        { method: 'GET', path: api.settings.apiPath+'/reel/{id}/run', config: { handler: Api.startReel, description: "run reel" } },
        { method: 'DELETE', path: api.settings.apiPath+'/reel/{id}', config: { handler: Api.deleteReel, description: "delete reel" } },
        { method: 'GET', path: api.settings.apiPath+'/reels', config: { handler: Api.getReels, description: "get reels" } },
        { method: 'GET', path: api.settings.apiPath+'/reel/{id}/cancel', config: { handler: Api.cancelReel, description: "cancel reel" } }
    ]);

    next();
};

exports.register.attributes = {

    pkg: require('../package.json')
};
