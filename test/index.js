var Code = require('code');
var Lab = require('lab');

var Bait = require('../lib/index');

var internals = {
    defaults: {
        dirPath: __dirname + '/tmp'
    }
};

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

describe('reel', function () {

    it('createReel reel1', function (done) {

        var config = {
            name: 'reel1',
            host: 'localhost',
            port: 8081,
            size: 4
        };
        var bait = new Bait(internals.defaults);
        var reel = bait.createReel(config);
        expect(reel.id).to.exist();
        done();
    });

    it('createReel reel2', function (done) {

        var config = {
            name: 'reel2',
            host: 'localhost',
            port: 8082,
            size: 4
        };
        var bait = new Bait(internals.defaults);
        var reel = bait.createReel(config);
        expect(reel.id).to.exist();
        done();
    });

    it('getReelByName reel1', function (done) {

        var bait = new Bait(internals.defaults);
        var reel = bait.getReelByName('reel1');
        expect(reel.id).to.exist();
        expect(reel.name).to.equal('reel1');
        done();
    });

    it('getReel', function (done) {

        var bait = new Bait(internals.defaults);
        var reel = bait.getReelByName('reel1');
        var getReel = bait.getReel(reel.id);
        expect(getReel.id).to.exist();
        expect(getReel.size).to.equal(4);
        done();
    });

    it('getReels', function (done) {

        var bait = new Bait(internals.defaults);
        var reels = bait.getReels();
        expect(reels.length).to.equal(2);
        done();
    });

    it('updateReel reel2', function (done) {

        var config = {
            size: 5
        };
        var bait = new Bait(internals.defaults);
        var reel = bait.getReelByName('reel2');
        var updateReel = bait.updateReel(reel.id, config);
        expect(updateReel.size).to.equal(5);
        done();
    });

    it('deleteReel reel2', function (done) {

        var bait = new Bait(internals.defaults);
        var reel = bait.getReelByName('reel2');
        expect(reel.id).to.exist();
        bait.deleteReel(reel.id);
        var reels = bait.getReels();
        expect(reels.length).to.equal(1);
        done();
    });

    it('deleteReel reel1', function (done) {

        var bait = new Bait(internals.defaults);
        var reel = bait.getReelByName('reel1');
        expect(reel.id).to.exist();
        bait.deleteReel(reel.id);
        var reels = bait.getReels();
        expect(reels.length).to.equal(0);
        done();
    });
});
