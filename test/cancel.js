var Code = require('code');
var Lab = require('lab');
var Hapi = require('hapi');

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

var internals = {
    defaults: {
        dirpath: '/tmp/testreel'
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

describe('cancel', function () {    

    it('POST /api/run', function (done) {

        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'sleep 5', 'date', 'uptime' ]
            };
            server.inject({ method: 'POST', url: '/api/run', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist();
                expect(response.result.id).to.exist();
                done();
            });
        });
    });

    it('GET /api/run/{runId}/start', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'GET', url: '/api/runs'}, function (response) {

                var runId = response.result[0];
                server.inject({ method: 'GET', url: '/api/run/'+ runId + '/start'}, function (response) {
      
                    //console.log('result:\n' + JSON.stringify(response.result, null, 4)); 
                    expect(response.statusCode).to.equal(200);
                    done();
                });
            });
        });
    });

    it('GET /api/run/{runId}/cancel', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'GET', url: '/api/runs'}, function (response) {

                var runId = response.result[0];
                server.inject({ method: 'GET', url: '/api/run/'+ runId + '/cancel'}, function (response) {

                    expect(response.statusCode).to.equal(200);
                    var intervalObj = setInterval(function() {

                        server.inject({ method: 'GET', url: '/api/run/'+ runId}, function (startResponse) {

                            //console.log(startResponse);       
                            if (startResponse.result.finishTime) {
                                clearInterval(intervalObj);
                                //console.log(startResponse);
                                expect(startResponse.result.id).to.exist();
                                expect(startResponse.result.status).to.equal('cancelled');
                                expect(startResponse.result.commands).to.be.length(3);
                                expect(startResponse.result.commands[0].startTime).to.exist();
                                expect(startResponse.result.commands[0].signal).to.equal('SIGTERM');
                                expect(startResponse.result.commands[1].startTime).to.not.exist();
                                done();
                            }
                        });
                    }, 1000);
                });
            });
        });
    });

    it('DELETE /api/run/{runId}', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'GET', url: '/api/runs'}, function (response) {

                var runId = response.result[0];
                server.inject({ method: 'DELETE', url: '/api/run/'+ runId }, function (response) {

                    expect(response.statusCode).to.equal(200);
                    expect(response.payload).to.exist();
                    done();
                });
            });
        });
    });

    it('DELETE /api/run/workspace', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'DELETE', url: '/api/run/workspace' }, function (response) {

                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });

});
