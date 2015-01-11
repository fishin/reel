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

describe('fail', function () {

    it('POST /api/run', function (done) {

        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'date', 'uptime', [ 'ls -altr', 'npm test', 'ls -altr' ], 'cat /etc/hosts' ]
            };
            server.inject({ method: 'POST', url: '/api/run', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist();
                expect(response.result.id).to.exist();
                var runId = response.result.id;
                done();
            });
        });
    });

    it('POST /api/run/{runId}/start', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'GET', url: '/api/runs'}, function (response) {

                var runId = response.result[0];
                server.inject({ method: 'GET', url: '/api/run/'+ runId + '/start'}, function (response) {
      
                    //console.log('result:\n' + JSON.stringify(response2.result, null, 4)); 
                    expect(response.statusCode).to.equal(200);
                    var intervalObj = setInterval(function() {

                        //console.log('made it to setInterval');
                        server.inject({ method: 'GET', url: '/api/run/'+ runId}, function (startResponse) {

                            //console.log(startResponse);       
                            if (startResponse.result.finishTime) {

                                clearInterval(intervalObj);
                                //console.log(startResponse.result);
                                expect(startResponse.result.id).to.exist();
                                expect(startResponse.result.commands).to.be.length(4);
                                expect(startResponse.result.commands[3].code).to.exist();
                                expect(startResponse.result.status).to.equal('failed');
                                done();
                            }
                        });
                    }, 1000);
                });
            });
        });
    });

    it('GET /api/run/{runId}', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'GET', url: '/api/runs'}, function (response) {

                var runId = response.result[0];
                server.inject({ method: 'GET', url: '/api/run/'+ runId}, function (response) {

                    expect(response.statusCode).to.equal(200);
                    expect(response.result.commands).to.exist();
                    expect(response.result.id).to.exist();
                    expect(response.result.createTime).to.exist();
                    done();
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
