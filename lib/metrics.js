'use strict';

var measured = require('measured');

exports = module.exports = function (config) {
    var metrics;

    metrics = measured.createCollection();

    return metrics;
};