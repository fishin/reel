var Fs = require('fs');
var Hapi = require('hapi');
var Lab = require('lab');
var Store = require('../lib/store/file');
var Path = require('path');

var internals = {};

var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var before = lab.before;
var after = lab.after;
var describe = lab.describe;
var it = lab.it;

describe('store', function () {

    it('getDirs with file', function (done) {

        var tmpDir = Path.join(__dirname, 'tmp');
        Fs.mkdirSync(tmpDir);
        var dirs = Store.getDirs(__dirname);
        expect(dirs).to.have.length(1);
        Fs.rmdirSync(tmpDir);
        var dirs2 = Store.getDirs(__dirname);
        console.log(dirs2);
        expect(dirs2).to.have.length(0);
        done();
    });

});
