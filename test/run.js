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

describe('run', function () {    

    it('POST /api/run', function (done) {
        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'git clone --branch=master https://github.com/fishin/reel .', 'npm install', 'bin/test.sh', [ 'uptime', 'npm list', 'ls -altr' ], 'date' ]
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

    it('GET /api/run/{runId}', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'GET', url: '/api/runs'}, function (response) {

                var runId = response.result[0];
                server.inject({ method: 'GET', url: '/api/run/'+ runId}, function (response2) {

                    expect(response2.statusCode).to.equal(200);
                    expect(response2.result.commands).to.exist();
                    expect(response2.result.id).to.exist();
                    expect(response2.result.createTime).to.exist();
                    done();
                });
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

    it('GET /api/run/{runId}', function (done) {

        internals.prepareServer(function (server) {

            server.inject({ method: 'GET', url: '/api/runs'}, function (response) {

                var runId = response.result[0];
                 var intervalObj = setInterval(function() {

                    //console.log('made it to setInterval');
                    server.inject({ method: 'GET', url: '/api/run/'+ runId}, function (startResponse) {

                        //console.log(startResponse);       
                        if (startResponse.result.finishTime) {
                            clearInterval(intervalObj); 
                            //console.log(startResponse.result);
                            expect(startResponse.result.status).to.equal('succeeded');
                            expect(startResponse.result.id).to.exist();
                            expect(startResponse.result.commands).to.be.length(7);
                            expect(startResponse.result.commands[2].stdout).to.equal('reelin em in\n');
                            done();
                        } 
                    });
                }, 1000); 
            });
        });
    });

    it('getWorkspaceArtifact', function (done) {

        internals.prepareServer(function (server) {

            var contents = server.plugins.reel.getWorkspaceArtifact('bin/test.sh');
            expect(contents).to.contain('reelin em in');
            done();
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

