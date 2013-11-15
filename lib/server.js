'use strict';

var metrics = require('metrics');

exports = module.exports = {
    create: function (config) {
        return new metrics.Server(config.metricsPort || 9091);
    }
};