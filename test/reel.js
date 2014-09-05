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


  it('POST /api/reel', function (done) {
        internals.prepareServer(function (server) {

            var payload = {
                commands: [ "date", "uptime", "cat /etc/hosts", [ "ls -altr", "ls" ] ],
            };
            server.inject({ method: 'POST', url: '/api/reel', payload: payload }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist;
                expect(response.result.reel_id).to.exist;
                var reel_id = response.result.reel_id;
                server.inject({ method: 'GET', url: '/api/reel/'+ reel_id}, function (response) {

                    expect(response.statusCode).to.equal(200);
                    expect(response.result.commands).to.exist;
                    expect(response.result.reel_id).to.exist;
                    expect(response.result.created).to.exist;
                    server.inject({ method: 'GET', url: '/api/reel/'+ reel_id + '/run'}, function (response) {
      
                        console.log(response.result); 
                        expect(response.statusCode).to.equal(200);
                        expect(response.result.reel_id).to.exist;
                        done();
                    });
                });
           });
       });
   });

/*


   it('GET /api/reel/run parallelcommand', function (done) {
        var reel_id = Store.getReelConfigByName('parallelcommand');
        internals.prepareServer(function (server) {
        });
    });

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

    it('DELETE /api/reel/{reel_id} parallelcommand', function (done) {
        var reel_id = Store.geReelConfigByName('parallelcommand');
        internals.prepareServer(function (server) {
            server.inject({ method: 'DELETE', url: '/api/job/'+ job_id }, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.payload).to.exist;
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

    it('GET /api/runs', function (done) {
        internals.prepareServer(function (server) {
            server.inject({ method: 'GET', url: '/api/runs'}, function (response) {

                expect(response.statusCode).to.equal(200);
                expect(response.result).to.have.length(2);
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
