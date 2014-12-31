var Code = require('code');
var Lab = require('lab');
var Hapi = require('hapi');

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

var internals = {
    defaults: {
        apiPath: '/api',
        reel: {
            dirpath: '/tmp/testreel'
        }
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

describe('runs', function () {    

    it('POST /api/run git', function (done) {

        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'git clone --branch=master https://github.com/fishin/pail .' ]
            };
            server.inject({ method: 'POST', url: '/api/run', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist();
                expect(response.result.id).to.exist();
                done();
            });
        });
    });

    it('POST /api/run date', function (done) {

        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'date' ]
            };
            server.inject({ method: 'POST', url: '/api/run', payload: payload}, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist();
                expect(response.result.id).to.exist();
                done();
            });
        });
    });

    it('GET /api/run/{runId}/start git', function (done) {

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

    it('GET /api/run/{runId}/pids 1', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'GET', url: '/api/runs'}, function (response) {

                var runId = response.result[0];
                server.inject({ method: 'GET', url: '/api/run/'+ runId + '/pids'}, function (pidResponse) {

                    //console.log(pidResponse.result);
                    expect(pidResponse.result).to.have.length(1);
                    done();
                });
            });
        });
    });

    it('GET /api/run/{runId}/start date', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'GET', url: '/api/runs'}, function (response) {

                var runId = response.result[1];
                server.inject({ method: 'GET', url: '/api/run/'+ runId+ '/start'}, function (response) {

                    //console.log('result:\n' + JSON.stringify(response.result, null, 4)); 
                    expect(response.statusCode).to.equal(200);
                    done();
                });
            });
        });
    });

    it('GET /api/run/{runId} run1', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'GET', url: '/api/runs'}, function (response) {

                var runId = response.result[0];
                var intervalObj = setInterval(function() {

                    server.inject({ method: 'GET', url: '/api/run/'+ runId}, function (startResponse) {
            
                        if (startResponse.result.finishTime) {
                            clearInterval(intervalObj);
                            //console.log(startResponse);
                            expect(startResponse.statusCode).to.equal(200);
                            done();
                        } 
                    });
                }, 1000); 
            });
        });
    });

    it('GET /api/run/{runId} run2', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'GET', url: '/api/runs'}, function (response) {

                var runId = response.result[1];
                var intervalObj = setInterval(function() {

                    server.inject({ method: 'GET', url: '/api/run/'+ runId}, function (startResponse) {
            
                        if (startResponse.result.finishTime) {
                            clearInterval(intervalObj);
                            //console.log(startResponse);
                            expect(startResponse.statusCode).to.equal(200);
                            done();
                        } 
                    });
                }, 1000); 
            });
        });
    });

    it('GET /api/run/{runId}/pids 0', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'GET', url: '/api/runs'}, function (response) {

                var runId = response.result[0];
                server.inject({ method: 'GET', url: '/api/run/'+ runId + '/pids'}, function (pidResponse) {

                    //console.log(pidResponse.result);
                    expect(pidResponse.result).to.have.length(0);
                    done();
                });
            });
        });
    });

    it('GET /api/run/bylink/last', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'GET', url: '/api/run/bylink/last'}, function (response) {

                //console.log(response);
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });

    it('GET /api/run/bylink/lastFail', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'GET', url: '/api/run/bylink/lastFail'}, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result).to.not.exist();
                done();
            });
        });
    });

    it('DELETE /api/run/{runId} run1', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'GET', url: '/api/runs'}, function (response) {

                var runId = response.result[0];
                server.inject({ method: 'DELETE', url: '/api/run/'+ runId}, function (response) {

                    expect(response.statusCode).to.equal(200);
                    expect(response.payload).to.exist();
                    done();
                });
            });
        });
    });

    it('DELETE /api/run/{runId} run2', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'GET', url: '/api/runs'}, function (response) {

                var runId = response.result[0];
                server.inject({ method: 'DELETE', url: '/api/run/'+ runId}, function (response) {

                    expect(response.statusCode).to.equal(200);
                    expect(response.payload).to.exist();
                    done();
                });
            });
        });
    });

    it('DELETE /api/run/workspace', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'DELETE', url: '/api/run/workspace'}, function (response) {

                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });
});
