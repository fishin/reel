'use strict';

const Code = require('code');
const Lab = require('lab');

const Bait = require('../lib/index');

const internals = {
    defaults: {
        dirPath: __dirname + '/tmp'
    }
};

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;

describe('reel', () => {

    it('createReel reel1', (done) => {

        const config = {
            name: 'reel1',
            host: 'localhost',
            port: 8081,
            size: 4
        };
        const bait = new Bait(internals.defaults);
        const reel = bait.createReel(config);
        expect(reel.id).to.exist();
        done();
    });

    it('createReel reel2', (done) => {

        const config = {
            name: 'reel2',
            host: 'localhost',
            port: 8082,
            size: 4
        };
        const bait = new Bait(internals.defaults);
        const reel = bait.createReel(config);
        expect(reel.id).to.exist();
        done();
    });

    it('getReelByName reel1', (done) => {

        const bait = new Bait(internals.defaults);
        const reel = bait.getReelByName('reel1');
        expect(reel.id).to.exist();
        expect(reel.name).to.equal('reel1');
        done();
    });

    it('getReel', (done) => {

        const bait = new Bait(internals.defaults);
        const reel = bait.getReelByName('reel1');
        const getReel = bait.getReel(reel.id);
        expect(getReel.id).to.exist();
        expect(getReel.size).to.equal(4);
        done();
    });

    it('getReels', (done) => {

        const bait = new Bait(internals.defaults);
        const reels = bait.getReels();
        expect(reels.length).to.equal(2);
        done();
    });

    it('updateReel reel2', (done) => {

        const config = {
            size: 5
        };
        const bait = new Bait(internals.defaults);
        const reel = bait.getReelByName('reel2');
        const updateReel = bait.updateReel(reel.id, config);
        expect(updateReel.size).to.equal(5);
        done();
    });

    it('deleteReel reel2', (done) => {

        const bait = new Bait(internals.defaults);
        const reel = bait.getReelByName('reel2');
        expect(reel.id).to.exist();
        bait.deleteReel(reel.id);
        const reels = bait.getReels();
        expect(reels.length).to.equal(1);
        done();
    });

    it('deleteReel reel1', (done) => {

        const bait = new Bait(internals.defaults);
        const reel = bait.getReelByName('reel1');
        expect(reel.id).to.exist();
        bait.deleteReel(reel.id);
        const reels = bait.getReels();
        expect(reels.length).to.equal(0);
        done();
    });
});
