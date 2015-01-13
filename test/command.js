var Code = require('code');
var Lab = require('lab');
var Hapi = require('hapi');

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

var internals = {
    defaults: {
        dirPath: '/tmp/testreel'
    }
};

internals.prepareServer = function (callback) {

    var server = new Hapi.Server();
    server.connection();
    server.register({
        register: require('..'),
        options: internals.defaults
    }, function (err) {

        expect(err).to.not.exist();
        callback(server);
    });
};

describe('command', function () {    

    it('POST /api/run/command valid', function (done) {

        internals.prepareServer(function (server) {

            var payload = {
                command: 'uptime'
            };
            server.inject({ method: 'POST', url: '/api/run/command', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.status).to.equal('succeeded');
                done();
            });
        });
    });

    it('POST /api/run/command invalid', function (done) {

        internals.prepareServer(function (server) {

            var payload = {
                command: 'invalid'
            };
            server.inject({ method: 'POST', url: '/api/run/command', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.status).to.equal('failed');
                expect(response.result.error).to.exist();
                done();
            });
        });
    });

    it('POST /api/run/command failed', function (done) {

        internals.prepareServer(function (server) {

            var payload = {
                command: 'ls lloyd'
            };
            server.inject({ method: 'POST', url: '/api/run/command', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.status).to.equal('failed');
                expect(response.result.stderr).to.exist();
                done();
            });
        });
    });
});
