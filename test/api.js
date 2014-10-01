var Lab = require('lab');
var Hapi = require('hapi');

var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var before = lab.before;
var after = lab.after;
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

    server.pack.register({

        plugin: require('..'),
        options: internals.defaults
    }, function (err) {

        expect(err).to.not.exist;
        callback(server);
    });
};

describe('api', function () {    

    it('CRUD flow of run', function (done) {
        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'git clone --branch=master https://github.com/fishin/reel .', 'npm install', 'bin/test.sh', [ 'uptime', 'npm list', 'ls -altr' ], 'date' ]
            };
            server.inject({ method: 'POST', url: '/api/run', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist;
                expect(response.result.id).to.exist;
                var run_id = response.result.id;
                server.inject({ method: 'GET', url: '/api/run/'+ run_id}, function (response2) {

                    expect(response2.statusCode).to.equal(200);
                    expect(response2.result.commands).to.exist;
                    expect(response2.result.id).to.exist;
                    expect(response2.result.createTime).to.exist;
                    server.inject({ method: 'GET', url: '/api/run/'+ run_id + '/start'}, function (response3) {

                        //console.log('result:\n' + JSON.stringify(response3.result, null, 4)); 
                        expect(response3.statusCode).to.equal(200);
                        var intervalObj = setInterval(function() {

                            //console.log('made it to setInterval');
                            server.inject({ method: 'GET', url: '/api/run/'+ run_id}, function (startResponse) {

                                //console.log(startResponse);       
                                if (startResponse.result.finishTime) {
                                    clearInterval(intervalObj); 
                                    //console.log(startResponse.result.commands);
                                    expect(startResponse.result.status).to.equal('succeeded');
                                    expect(startResponse.result.id).to.exist;
                                    expect(startResponse.result.commands).to.be.length(8);
                                    expect(startResponse.result.commands[2].stdout).to.equal('reelin em in\n');
                                    server.inject({ method: 'GET', url: '/api/run/'+ run_id + '/pid'}, function (pidResponse) {

                                        //console.log(pidResponse.result);
                                        expect(pidResponse.result).to.not.exist;
                                    });
                                    server.inject({ method: 'GET', url: '/api/runs'}, function (response4) {

                                        //console.log('runs: ' + response4.result);
                                        expect(response4.statusCode).to.equal(200);
                                        expect(response4.result).to.have.length(1);
                                        server.inject({ method: 'DELETE', url: '/api/run/'+ run_id }, function (response5) {

                                            expect(response5.statusCode).to.equal(200);
                                            expect(response5.payload).to.exist;
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

    it('cancel flow of run', function (done) {
        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'sleep 5', 'date' ]
            };
            server.inject({ method: 'POST', url: '/api/run', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist;
                expect(response.result.id).to.exist;
                var run_id = response.result.id;
                server.inject({ method: 'GET', url: '/api/run/'+ run_id + '/start'}, function (response2) {
      
                    //console.log('result:\n' + JSON.stringify(response2.result, null, 4)); 
                    expect(response2.statusCode).to.equal(200);
                    server.inject({ method: 'GET', url: '/api/run/'+ run_id + '/cancel'}, function (response4) {

                        expect(response4.statusCode).to.equal(200);
                        expect(response4.result.status).to.equal('cancelled');
                        expect(response4.result).to.exist;
                        var intervalObj = setInterval(function() {

                            server.inject({ method: 'GET', url: '/api/run/'+ run_id}, function (startResponse) {

                                //console.log(startResponse);       
                                if (startResponse.result.finishTime) {
                                    clearInterval(intervalObj);
                                    expect(startResponse.result.id).to.exist;
                                    expect(startResponse.result.commands).to.be.length(2);
                                    server.inject({ method: 'DELETE', url: '/api/run/'+ run_id }, function (response5) {

                                        expect(response5.statusCode).to.equal(200);
                                        expect(response5.payload).to.exist;
                                        done();
                                    });
                                }
                            });
                        }, 1000);
                    });
                });
           });
       });
   });

    it('invalid command flow of run serial', function (done) {
        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'date', 'uptime', 'invalid', 'cat /etc/hosts' ]
            };
            server.inject({ method: 'POST', url: '/api/run', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist;
                expect(response.result.id).to.exist;
                var run_id = response.result.id;
                server.inject({ method: 'GET', url: '/api/run/'+ run_id + '/start'}, function (response2) {
      
                    //console.log('result:\n' + JSON.stringify(response2.result, null, 4)); 
                    expect(response2.statusCode).to.equal(200);
                    var intervalObj = setInterval(function() {

                        server.inject({ method: 'GET', url: '/api/run/'+ run_id}, function (startResponse) {

                            //console.log(startResponse.result);       
                            if (startResponse.result.finishTime) {
                                clearInterval(intervalObj);
                                expect(startResponse.result.id).to.exist;
                                expect(startResponse.result.commands).to.be.length(4);
                                expect(startResponse.result.commands[2].error).to.exist;
                                expect(startResponse.result.commands[3].pid).to.not.exist;
                                expect(startResponse.result.status).to.equal('failed');
                                server.inject({ method: 'DELETE', url: '/api/run/'+ run_id }, function (response5) {

                                    expect(response5.statusCode).to.equal(200);
                                    expect(response5.payload).to.exist;
                                    done();
                                });
                            }
                        });
                    }, 1000);
                });
           });
       });
   });

    it('invalid command flow of run parallel', function (done) {
        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'date', 'uptime', [ 'ls -altr', 'invalid', 'ls -altr' ], 'cat /etc/hosts' ]
            };
            server.inject({ method: 'POST', url: '/api/run', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist;
                expect(response.result.id).to.exist;
                var run_id = response.result.id;
                server.inject({ method: 'GET', url: '/api/run/'+ run_id + '/start'}, function (response2) {
      
                    //console.log('result:\n' + JSON.stringify(response2.result, null, 4)); 
                    expect(response2.statusCode).to.equal(200);
                    var intervalObj = setInterval(function() {

                        //console.log('made it to setInterval');
                        server.inject({ method: 'GET', url: '/api/run/'+ run_id}, function (startResponse) {

                            //console.log(startResponse);       
                            if (startResponse.result.finishTime) {

                                clearInterval(intervalObj);
                                //console.log(startResponse.result);
                                expect(startResponse.result.id).to.exist;
                                expect(startResponse.result.commands).to.be.length(7);
                                expect(startResponse.result.commands[5].error).to.exist;
                                expect(startResponse.result.commands[6].pid).to.not.exist;
                                expect(startResponse.result.status).to.equal('failed');
                                server.inject({ method: 'GET', url: '/api/run/'+ run_id}, function (response3) {

                                    expect(response3.statusCode).to.equal(200);
                                    expect(response3.result.commands).to.exist;
                                    expect(response3.result.id).to.exist;
                                    expect(response3.result.createTime).to.exist;
                                    server.inject({ method: 'DELETE', url: '/api/run/'+ run_id }, function (response5) {

                                        expect(response5.statusCode).to.equal(200);
                                        expect(response5.payload).to.exist;
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

    it('command fail flow of run serial', function (done) {
        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'date', 'npm test', 'cat /etc/hosts' ]
            };
            server.inject({ method: 'POST', url: '/api/run', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist;
                expect(response.result.id).to.exist;
                var run_id = response.result.id;
                server.inject({ method: 'GET', url: '/api/run/'+ run_id + '/start'}, function (response2) {
      
                    //console.log('result:\n' + JSON.stringify(response2.result, null, 4)); 
                    expect(response2.statusCode).to.equal(200);
                    var intervalObj = setInterval(function() {

                        //console.log('made it to setInterval');
                        server.inject({ method: 'GET', url: '/api/run/'+ run_id}, function (startResponse) {

                            //console.log(startResponse);       
                            if (startResponse.result.finishTime) {
                                clearInterval(intervalObj);
                                expect(startResponse.result.id).to.exist;
                                expect(startResponse.result.commands).to.be.length(3);
                                expect(startResponse.result.commands[1].code).to.exist;
                                expect(startResponse.result.commands[2].pid).to.not.exist;
                                expect(startResponse.result.status).to.equal('failed');
                                server.inject({ method: 'GET', url: '/api/run/'+ run_id}, function (response3) {

                                    expect(response3.statusCode).to.equal(200);
                                    expect(response3.result.commands).to.exist;
                                    expect(response3.result.id).to.exist;
                                    expect(response3.result.createTime).to.exist;
                                    server.inject({ method: 'DELETE', url: '/api/run/'+ run_id }, function (response5) {

                                        expect(response5.statusCode).to.equal(200);
                                        expect(response5.payload).to.exist;
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

    it('command fail flow of run parallel', function (done) {
        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'date', 'uptime', [ 'ls -altr', 'npm test', 'ls -altr' ], 'cat /etc/hosts' ]
            };
            server.inject({ method: 'POST', url: '/api/run', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist;
                expect(response.result.id).to.exist;
                var run_id = response.result.id;
                server.inject({ method: 'GET', url: '/api/run/'+ run_id + '/start'}, function (response2) {
      
                    //console.log('result:\n' + JSON.stringify(response2.result, null, 4)); 
                    expect(response2.statusCode).to.equal(200);
                    var intervalObj = setInterval(function() {

                        //console.log('made it to setInterval');
                        server.inject({ method: 'GET', url: '/api/run/'+ run_id}, function (startResponse) {

                            //console.log(startResponse);       
                            if (startResponse.result.finishTime) {

                                clearInterval(intervalObj);
                                //console.log(startResponse.result);
                                expect(startResponse.result.id).to.exist;
                                expect(startResponse.result.commands).to.be.length(7);
                                expect(startResponse.result.commands[5].code).to.exist;
                                //expect(startResponse.result.commands[6].pid).to.not.exist;
                                expect(startResponse.result.status).to.equal('failed');
                                server.inject({ method: 'GET', url: '/api/run/'+ run_id}, function (response3) {

                                    expect(response3.statusCode).to.equal(200);
                                    expect(response3.result.commands).to.exist;
                                    expect(response3.result.id).to.exist;
                                    expect(response3.result.createTime).to.exist;
                                    server.inject({ method: 'DELETE', url: '/api/run/'+ run_id }, function (response5) {

                                        expect(response5.statusCode).to.equal(200);
                                        expect(response5.payload).to.exist;
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

    it('getRunByLink last', function (done) {

        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'date' ]
            };
            server.inject({ method: 'POST', url: '/api/run', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist;
                expect(response.result.id).to.exist;
                var run_id = response.result.id;
                server.inject({ method: 'GET', url: '/api/run/'+ run_id + '/start'}, function (response2) {
      
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
                                expect(startResponse.result.id).to.exist;
                                expect(startResponse.result.commands).to.be.length(1);
                                expect(startResponse.result.status).to.equal('succeeded');
                                server.inject({ method: 'DELETE', url: '/api/run/'+ run_id }, function (response5) {

                                    expect(response5.statusCode).to.equal(200);
                                    expect(response5.payload).to.exist;
                                    done();
                                });
                            }
                        });
                    }, 1000);
                });
           });
       });
   });

    it('CRUD flow of multiple runs', function (done) {
        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'git clone --branch=master https://github.com/fishin/reel .' ]
            };
            var payload2 = {
                commands: [ 'date' ]
            };
            server.inject({ method: 'POST', url: '/api/run', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist;
                expect(response.result.id).to.exist;
                var run_id = response.result.id;
                server.inject({ method: 'GET', url: '/api/run/'+ run_id + '/start'}, function (response3) {

                    //console.log('result:\n' + JSON.stringify(response3.result, null, 4)); 
                    expect(response3.statusCode).to.equal(200);
                    server.inject({ method: 'POST', url: '/api/run', payload: payload2}, function (response) {

                        expect(response.statusCode).to.equal(200);
                        expect(response.payload).to.exist;
                        expect(response.result.id).to.exist;
                        var run_id2 = response.result.id;
                        server.inject({ method: 'GET', url: '/api/run/'+ run_id2+ '/start'}, function (response3) {

                            //console.log('result:\n' + JSON.stringify(response3.result, null, 4)); 
                            expect(response3.statusCode).to.equal(200);
                            server.inject({ method: 'GET', url: '/api/run/'+ run_id2 + '/pid'}, function (pidResponse) {

                                //console.log(pidResponse.result);
                                expect(pidResponse.result).to.exist;
                            });
                            var intervalObj = setInterval(function() {

                                //console.log('made it to setInterval');
                                server.inject({ method: 'GET', url: '/api/run/'+ run_id}, function (startResponse) {

                                    //console.log(startResponse);
                                    var intervalObj2 = setInterval(function() {

                                        //console.log('made it to setInterval');
                                        server.inject({ method: 'GET', url: '/api/run/'+ run_id2}, function (startResponse2) {

                                            //console.log(startResponse2);       
                                            if (startResponse2.result.finishTime) {
                                                clearInterval(intervalObj2); 
                                                server.inject({ method: 'GET', url: '/api/runs'}, function (response4) {

                                                    //console.log('runs: ' + response4.result);
                                                    expect(response4.statusCode).to.equal(200);
                                                    expect(response4.result).to.have.length(2);
                                                    server.inject({ method: 'DELETE', url: '/api/run/'+ run_id2}, function (response5) {

                                                        expect(response5.statusCode).to.equal(200);
                                                        expect(response5.payload).to.exist;
                                                        server.inject({ method: 'DELETE', url: '/api/run/'+ run_id}, function (response5) {

                                                            expect(response5.statusCode).to.equal(200);
                                                            expect(response5.payload).to.exist;
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
