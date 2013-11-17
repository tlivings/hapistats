'use strict';

var measured = require('measured'),
    fn = require('./fn'),
    chainable = fn.chainable;

exports.create = function () {

    var metrics = measured.createCollection();

    return {

        counter: function (name) {
            var count = metrics.counter(name);
            return chainable({
                inc: count.inc.bind(count),
                dec: count.dec.bind(count)
            });
        },

        timer: function (name) {
            var timer;
            return chainable({
                start: function () {
                    timer = metrics.timer(name);
                },
                end: function () {
                    timer && timer.end();
                }
            });
        },

        gauge: function (name, fn) {
            var value = fn;
            if (typeof fn !== 'function') {
                value = function () {
                    return fn;
                };
            }
            metrics.gauge(name, value);
        },

        meter: function (name) {
            var meter = metrics.meter(name);
            return chainable({
                mark: meter.mark.bind(meter),
                sample: meter.toJSON.bind(meter)
            });
        },

        toJSON: metrics.toJSON.bind(metrics)

    }

};