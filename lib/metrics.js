'use strict';

var metrics = require('metrics'),
    server = require('./server');

exports = module.exports = function (config) {
    var report;

    config = config || {};

    report = new metrics.Report();

    function createMetric(type) {
        return function (eventName) {
            type = type[0].toUpperCase() + type.substring(1);
            report.addMetric(eventName, new metrics[type]());
            return getMetric(eventName);
        };
    }

    function getMetric(eventName) {
        var metric, namespaces, event, namespace;

        namespaces = eventName.split('.');
        event = namespaces.pop();
        namespace = namespaces.join('.');

        metric = report.trackedMetrics[namespace][event];

        return metric;
    }

    return {

        handler: function (req) {
            req.reply(report.summary());
        },

        createCounter: createMetric('counter'),

        createHistogram: createMetric('histogram'),

        createMeter: createMetric('meter'),

        createTimer: createMetric('timer'),

        stats: function (name) {
            return getMetric(name).printObj();
        }

    };
};