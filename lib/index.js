'use strict';

const Pail = require('pail');
const Hoek = require('hoek');

const internals = {};

module.exports = internals.Reel = function (options) {

    internals.Reel.settings = options;
    internals.Reel.getReel = exports.getReel;
    this.createReel = exports.createReel;
    this.deleteReel = exports.deleteReel;
    this.getReel = exports.getReel;
    this.getReelByName = exports.getReelByName;
    this.updateReel = exports.updateReel;
    this.getReels = exports.getReels;
};

exports.createReel = function (payload) {

    const pail = new Pail(internals.Reel.settings);
    const updatePail = pail.createPail(payload);
    return updatePail;
};

exports.updateReel = function (reelId, payload) {

    const pail = new Pail(internals.Reel.settings);
    const getPail = pail.getPail(reelId);
    const config = Hoek.applyToDefaults(getPail, payload);
    config.updateTime = new Date().getTime();
    const updatedPail = pail.updatePail(config);
    return updatedPail;
};

exports.getReel = function (reelId) {

    const pail = new Pail(internals.Reel.settings);
    const config = pail.getPail(reelId);
    return config;
};

exports.getReelByName = function (name) {

    const pail = new Pail(internals.Reel.settings);
    const reelId = pail.getPailByName(name);
    const config = pail.getPail(reelId);
    return config;
};

exports.getReels = function () {

    const pail = new Pail(internals.Reel.settings);
    const reels = pail.getPails();
    const fullReels = [];
    for (let i = 0; i < reels.length; ++i) {
        const reel = internals.Reel.getReel(reels[i]);
        fullReels.push(reel);
    }
    // sort by createTime
    fullReels.sort((a, b) => {

        return b.createTime - a.createTime;
    });
    return fullReels;
};

exports.deleteReel = function (reelId) {

    const pail = new Pail(internals.Reel.settings);
    pail.deletePail(reelId);
    return null;
};
