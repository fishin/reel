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
            dirpath: '/tmp/testreel',
            workspace: 'workspace',
            configFile: 'config.json'
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

describe('run', function () {    

    it('CRUD flow', function (done) {
        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'git clone --branch=master https://github.com/fishin/reel .', 'npm install', 'bin/test.sh', [ 'uptime', 'npm list', 'ls -altr' ], 'date' ]
            };
            server.inject({ method: 'POST', url: '/api/run', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist();
                expect(response.result.id).to.exist();
                var runId = response.result.id;
                server.inject({ method: 'GET', url: '/api/run/'+ runId}, function (response2) {

                    expect(response2.statusCode).to.equal(200);
                    expect(response2.result.commands).to.exist();
                    expect(response2.result.id).to.exist();
                    expect(response2.result.createTime).to.exist();
                    server.inject({ method: 'GET', url: '/api/run/'+ runId + '/start'}, function (response3) {

                        //console.log('result:\n' + JSON.stringify(response3.result, null, 4)); 
                        expect(response3.statusCode).to.equal(200);
                        var intervalObj = setInterval(function() {

                            //console.log('made it to setInterval');
                            server.inject({ method: 'GET', url: '/api/run/'+ runId}, function (startResponse) {

                                //console.log(startResponse);       
                                if (startResponse.result.finishTime) {
                                    clearInterval(intervalObj); 
                                    //console.log(startResponse.result.commands);
                                    expect(startResponse.result.status).to.equal('succeeded');
                                    expect(startResponse.result.id).to.exist();
                                    expect(startResponse.result.commands).to.be.length(8);
                                    expect(startResponse.result.commands[2].stdout).to.equal('reelin em in\n');
                                    server.inject({ method: 'GET', url: '/api/run/'+ runId + '/pids'}, function (pidResponse) {

                                        //console.log(pidResponse.result);
                                        expect(pidResponse.result).to.have.length(0);
                                    });
                                    server.inject({ method: 'GET', url: '/api/runs'}, function (response4) {

                                        //console.log('runs: ' + response4.result);
                                        expect(response4.statusCode).to.equal(200);
                                        expect(response4.result).to.have.length(1);
                                        server.inject({ method: 'DELETE', url: '/api/run/'+ runId }, function (response5) {

                                            expect(response5.statusCode).to.equal(200);
                                            expect(response5.payload).to.exist();
                                            done();
                                        });
                                    });
                                } 
                            });
                        }, 5000); 
                    });
                });
           });
       });
    });

    it('getRunByLink last', function (done) {

        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'date' ]
            };
            server.inject({ method: 'POST', url: '/api/run', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist();
                expect(response.result.id).to.exist();
                var runId = response.result.id;
                server.inject({ method: 'GET', url: '/api/run/'+ runId + '/start'}, function (response2) {
      
                    //console.log('result:\n' + JSON.stringify(response2.result, null, 4)); 
                    expect(response2.statusCode).to.equal(200);
                    var intervalObj = setInterval(function() {

                        //console.log('made it to setInterval');
                        server.inject({ method: 'GET', url: '/api/run/bylink/last'}, function (startResponse) {

                            expect(startResponse.statusCode).to.equal(200);
                            //console.log(startResponse);       
                            if (startResponse.result.finishTime) {

                                clearInterval(intervalObj);
                                //console.log(startResponse.result);
                                expect(startResponse.result.id).to.exist();
                                expect(startResponse.result.commands).to.be.length(1);
                                expect(startResponse.result.status).to.equal('succeeded');
                                server.inject({ method: 'GET', url: '/api/run/bylink/lastFail'}, function (emptyResponse) {

                                    expect(emptyResponse.statusCode).to.equal(200);
                                    expect(emptyResponse.result).to.not.exist();
                                    server.inject({ method: 'DELETE', url: '/api/run/'+ runId }, function (response5) {

                                        expect(response5.statusCode).to.equal(200);
                                        expect(response5.payload).to.exist();
                                        done();
                                    });
                                });
                            }
                        });
                    }, 1000);
                });
           });
       });
   });

});
