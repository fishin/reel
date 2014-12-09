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

    server.pack.register({

        plugin: require('..'),
        options: internals.defaults
    }, function (err) {

        expect(err).to.not.exist();
        callback(server);
    });
};

describe('invalid', function () {    

    it('serial', function (done) {
        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'date', 'uptime', 'invalid', 'cat /etc/hosts' ]
            };
            server.inject({ method: 'POST', url: '/api/run', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist();
                expect(response.result.id).to.exist();
                var run_id = response.result.id;
                server.inject({ method: 'GET', url: '/api/run/'+ run_id + '/start'}, function (response2) {
      
                    //console.log('result:\n' + JSON.stringify(response2.result, null, 4)); 
                    expect(response2.statusCode).to.equal(200);
                    var intervalObj = setInterval(function() {

                        server.inject({ method: 'GET', url: '/api/run/'+ run_id}, function (startResponse) {

                            //console.log(startResponse.result);       
                            if (startResponse.result.finishTime) {
                                clearInterval(intervalObj);
                                expect(startResponse.result.id).to.exist();
                                expect(startResponse.result.commands).to.be.length(4);
                                expect(startResponse.result.commands[2].error).to.exist();
                                expect(startResponse.result.commands[3].pid).to.not.exist();
                                expect(startResponse.result.status).to.equal('failed');
                                server.inject({ method: 'DELETE', url: '/api/run/'+ run_id }, function (response5) {

                                    expect(response5.statusCode).to.equal(200);
                                    expect(response5.payload).to.exist();
                                    done();
                                });
                            }
                        });
                    }, 1000);
                });
           });
       });
   });

    it('parallel', function (done) {
        internals.prepareServer(function (server) {

            var payload = {
                commands: [ 'date', 'uptime', [ 'ls -altr', 'invalid', 'ls -altr' ], 'cat /etc/hosts' ]
            };
            server.inject({ method: 'POST', url: '/api/run', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist();
                expect(response.result.id).to.exist();
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
                                expect(startResponse.result.id).to.exist();
                                expect(startResponse.result.commands).to.be.length(7);
                                expect(startResponse.result.commands[5].error).to.exist();
                                expect(startResponse.result.commands[6].pid).to.not.exist();
                                expect(startResponse.result.status).to.equal('failed');
                                server.inject({ method: 'GET', url: '/api/run/'+ run_id}, function (response3) {

                                    expect(response3.statusCode).to.equal(200);
                                    expect(response3.result.commands).to.exist();
                                    expect(response3.result.id).to.exist();
                                    expect(response3.result.createTime).to.exist();
                                    server.inject({ method: 'DELETE', url: '/api/run/'+ run_id }, function (response5) {

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
