var Lab = require('lab');
var Hapi = require('hapi');
var Store = require('../lib/store/file');

var internals = {};

var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var before = lab.before;
var after = lab.after;
var describe = lab.describe;
var it = lab.it;

internals.prepareServer = function (callback) {
    var server = new Hapi.Server();

    server.pack.register({

        plugin: require('..')
    }, function (err) {

        expect(err).to.not.exist;
        callback(server);
    });
};

describe('api', function () {    

    it('CRUD flow of reel', function (done) {
        internals.prepareServer(function (server) {

            var payload = {
                commands: [ "date", "uptime", "cat /etc/hosts", [ "sleep 5", "pwd", "ls -altr" ] ],
            };
            server.inject({ method: 'POST', url: '/api/reel', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist;
                expect(response.result.reel_id).to.exist;
                var reel_id = response.result.reel_id;
                server.inject({ method: 'GET', url: '/api/reel/'+ reel_id}, function (response2) {

                    expect(response2.statusCode).to.equal(200);
                    expect(response2.result.commands).to.exist;
                    expect(response2.result.reel_id).to.exist;
                    expect(response2.result.created).to.exist;
                    server.inject({ method: 'GET', url: '/api/reel/'+ reel_id + '/run'}, function (response3) {
      
                        console.log('results:\n' + JSON.stringify(response3.result.results, null, 4)); 
                        expect(response3.statusCode).to.equal(200);
                        expect(response3.result.reel_id).to.exist;
                        expect(response3.result.results).to.be.length(4);
                        server.inject({ method: 'GET', url: '/api/reels'}, function (response4) {

                            console.log('reels: ' + response4.result);
                            expect(response4.statusCode).to.equal(200);
                            expect(response4.result).to.have.length(1);
                            server.inject({ method: 'DELETE', url: '/api/reel/'+ reel_id }, function (response5) {

                                expect(response5.statusCode).to.equal(200);
                                expect(response5.payload).to.exist;
                                done();
                            });
                        });
                    });
                });
           });
       });
    });

    it('cancel flow of reel', function (done) {
        internals.prepareServer(function (server) {

            var payload = {
                commands: [ "date", "uptime", "cat /etc/hosts", [ "sleep 5", "pwd", "ls -altr" ] ],
            };
            server.inject({ method: 'POST', url: '/api/reel', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist;
                expect(response.result.reel_id).to.exist;
                var reel_id = response.result.reel_id;
                server.inject({ method: 'GET', url: '/api/reel/'+ reel_id + '/run'}, function (response2) {
      
                    expect(response2.statusCode).to.equal(200);
                    expect(response2.result.reel_id).to.exist;
                    expect(response2.result.results).to.be.length(4);
                    server.inject({ method: 'GET', url: '/api/reel/'+ reel_id}, function (response3) {

                        expect(response3.statusCode).to.equal(200);
                        expect(response3.result.commands).to.exist;
                        expect(response3.result.reel_id).to.exist;
                        expect(response3.result.created).to.exist;
                        server.inject({ method: 'GET', url: '/api/reel/'+ reel_id + '/cancel'}, function (response4) {

                            expect(response4.statusCode).to.equal(200);
                            expect(response4.result.status).to.equal('cancelled');
                            expect(response4.result).to.exist;
                            server.inject({ method: 'DELETE', url: '/api/reel/'+ reel_id }, function (response5) {

                                expect(response5.statusCode).to.equal(200);
                                expect(response5.payload).to.exist;
                                done();
                            });
                        });
                    });
                });
           });
       });
   });

/*


    it('GET /api/reel/{reel_id}/console git', function (done) {
        var reel_id = Store.getReelByLabel('last');
        internals.prepareServer(function (server) {
            server.inject({ method: 'GET', url: '/api/reel/' + reel_id + '/console' }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result.console).to.exist;
                done();
            });
        });
    });

    it('POST /api/reel missingcommand', function (done) {

         var payload = {};
         internals.prepareServer(function (server) {

             server.inject({ method: 'POST', url: '/api/reel', payload: payload }, function (response) {

                 expect(response.statusCode).to.equal(404);
                 expect(response.payload).to.exist;
                 expect(response.result.reel_id).to.not.exist;
                 expect(response.result.err).to.exist;
                 done();
             });
         });
    });

    it('GET /api/reel/{reel_id}/cancel', function (done) {
        var reel_id = Store.getReelConfigByName('latest');
        internals.prepareServer(function (server) {
            server.inject({ method: 'GET', url: '/api/reel/' + reel_id + '/cancel' }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist;
                done();
            });
        });
    });
*/
});
