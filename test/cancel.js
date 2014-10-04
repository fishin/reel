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

describe('cancel', function () {    

    it('flow', function (done) {

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

});
