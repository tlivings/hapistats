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

    function getMetric(eventName) {
        var metric, namespaces, event, namespace;

        namespaces = eventName.split('.');
        event = namespaces.pop();
        namespace = namespaces.join('.');

        metric = metricsServer.report.trackedMetrics[namespace][event];

        return metric;
    }

    function updateMetric(method, eventName) {
        var args = Array.prototype.slice.call(arguments);

        args = args.length > 2 ? args.slice(2) : [];

        var metric = getMetric(eventName);

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
            req.reply(metricsServer.report.summary());
        },

        createCounter: function (name) {
            metricsServer.addMetric(name, new metrics.Counter());
            return {
                increment: metricMethod('inc').bind(null, name),
                decrement: metricMethod('dec').bind(null, name),
                reset: metricMethod('clear').bind(null, name)
            };
        },

        createHistogram: function (name) {
            metricsServer.addMetric(name, new metrics.Histogram());
            return {
                update: metricMethod('update').bind(null, name),
                reset: metricMethod('clear').bind(null, name)
            };
        },

        createMeter: function (name) {
            metricsServer.addMetric(name, new metrics.Meter());
            return {
                mark: metricMethod('mark').bind(null, name),
                reset: metricMethod('clear').bind(null, name)
            };
        },

        stats: function (name) {
            return getMetric(name).printObj();
        }

    };
};