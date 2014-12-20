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

describe('runs', function () {    

    it('CRUD flow', function (done) {
        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'git clone --branch=master https://github.com/fishin/reel .' ]
            };
            var payload2 = {
                commands: [ 'date' ]
            };
            server.inject({ method: 'POST', url: '/api/run', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist();
                expect(response.result.id).to.exist();
                var runId = response.result.id;
                server.inject({ method: 'GET', url: '/api/run/'+ runId + '/start'}, function (response3) {

                    //console.log('result:\n' + JSON.stringify(response3.result, null, 4)); 
                    expect(response3.statusCode).to.equal(200);
                    server.inject({ method: 'POST', url: '/api/run', payload: payload2}, function (response) {

                        expect(response.statusCode).to.equal(200);
                        expect(response.payload).to.exist();
                        expect(response.result.id).to.exist();
                        var runId2 = response.result.id;
                        server.inject({ method: 'GET', url: '/api/run/'+ runId2+ '/start'}, function (response3) {

                            //console.log('result:\n' + JSON.stringify(response3.result, null, 4)); 
                            expect(response3.statusCode).to.equal(200);
                            server.inject({ method: 'GET', url: '/api/run/'+ runId2 + '/pids'}, function (pidResponse) {

                                //console.log(pidResponse.result);
                                expect(pidResponse.result).to.exist();
                            });
                            var intervalObj = setInterval(function() {

                                //console.log('made it to setInterval');
                                server.inject({ method: 'GET', url: '/api/run/'+ runId}, function (startResponse) {

                                    //console.log(startResponse);
                                    var intervalObj2 = setInterval(function() {

                                        //console.log('made it to setInterval');
                                        server.inject({ method: 'GET', url: '/api/run/'+ runId2}, function (startResponse2) {

                                            //console.log(startResponse2);       
                                            if (startResponse2.result.finishTime) {
                                                clearInterval(intervalObj2); 
                                                server.inject({ method: 'GET', url: '/api/runs'}, function (response4) {

                                                    //console.log('runs: ' + response4.result);
                                                    expect(response4.statusCode).to.equal(200);
                                                    expect(response4.result).to.have.length(2);
                                                    server.inject({ method: 'DELETE', url: '/api/run/'+ runId2}, function (response5) {

                                                        expect(response5.statusCode).to.equal(200);
                                                        expect(response5.payload).to.exist();
                                                        server.inject({ method: 'DELETE', url: '/api/run/'+ runId}, function (response5) {

                                                            expect(response5.statusCode).to.equal(200);
                                                            expect(response5.payload).to.exist();
                                                            done();
                                                        });
                                                    });
                                                });
                                             } 
                                         });
                                    }, 1000); 
                                });
                            }, 1000); 
                        });
                    });
                });
            });
       });
   });

});
