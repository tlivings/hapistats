'use strict';

var measured = require('measured'),
    fn = require('./fn'),
    chain = fn.chain;

exports.create = function () {

    var metrics = measured.createCollection();

    return {

        counter: function (name) {
            var count = metrics.counter(name);
            return {
                inc: chain(count.inc.bind(count)),
                dec: chain(count.dec.bind(count))
            };
        },

        timer: function (name) {
            var timer;
            return {
                start: chain(function () {
                    timer = metrics.timer(name);
                }),
                end: chain(function () {
                    timer && timer.end();
                })
            }
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
            return {
                mark: chain(meter.mark.bind(meter)),
                sample: chain(meter.toJSON.bind(meter))
            };
        },

        toJSON: metrics.toJSON.bind(metrics)

    }

};