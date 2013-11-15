'use strict';

var metrics = require('metrics'),
    server = require('./server');

exports = module.exports = function (config) {
    var metricsServer;

    config = config || {};

    metricsServer = server.create(config);

    function createMetric(type) {
        return function (eventName) {
            type = type[0].toUpperCase() + type.substring(1);
            metricsServer.addMetric(eventName, new metrics[type]());
        };
    }

    function updateMetric(method, eventName) {
        var args = Array.prototype.slice.call(arguments),
            namespaces = eventName.split('.'),
            event = namespaces.pop(),
            namespace = namespaces.join('.');

        args = args.length > 2 ? args.slice(2) : [];

        var metric = metricsServer.report.trackedMetrics[namespace][event];

        metric[method].apply(metric, args.slice(2));
    }

    function metricMethod(method) {
        return function (eventName) {
            var args = Array.prototype.slice.call(arguments);

            args.unshift(method);

            updateMetric.apply(null, args);
        };
    }

    return {

        handler: function (req) {
            req.reply();
        },

        createCounter: createMetric('Counter'),

        createHistogram: createMetric('Histogram'),

        createMeter: createMetric('Meter'),

        createTimer: createMetric('Timer'),

        update: metricMethod('update'),

        mark: metricMethod('mark'),

        increment: metricMethod('inc'),

        decrement: metricMethod('dec'),

        clear: metricMethod('clear')

    };
};