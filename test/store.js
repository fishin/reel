var Fs = require('fs');
var Hapi = require('hapi');
var Lab = require('lab');
var Store = require('../lib/store/file');

var internals = {};

var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var before = lab.before;
var after = lab.after;
var describe = lab.describe;
var it = lab.it;

describe('store', function () {

/*
    it('getDirs with file', function (done) {

        var tmpDir = '/tmp/getDirs';
        Fs.mkdirSync(tmpDir);
        var extraDir = tmpDir+'/tmpdir';
        Fs.mkdirSync(extraDir);
        var tmpFile = 'tmpFile';
        var tmpPath = tmpDir + '/' + tmpFile;
        Fs.writeFileSync(tmpPath, 'tmp contents');
        var dirs = Store.getDirs(tmpDir);
        expect(dirs).to.have.length(1);
        Store.rmdirFull(tmpDir);
        var dirs2 = Store.getDirs(tmpDir);
        expect(dirs2).to.have.length(0);
        done();
    });

*/
});
