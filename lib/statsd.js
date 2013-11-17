'use strict';

var Lynx = require('lynx'),
    fn = require('./fn'),
    chain = fn.chain,
    measured = require('./measured');


exports.create = function (options) {

    var sample = fn.interval(options.interval || 5000),
        lynx = new Lynx(options.host, options.port, options);

    return Object.create(measured.create(), {

        super_: {
            get: function () {
                return Object.getPrototypeOf(this);
            }
        },

        counter: {
            value: function (name) {
                var parent = this.super_.counter(name);
                return {
                    inc: chain(function () {
                        lynx.increment(name);
                        parent.inc();
                    }),
                    dec: chain(function () {
                        lynx.decrement(name);
                        parent.dec();
                    })
                };
            }
        },

        timer: {
            value: function (name) {
                var parent, timer;
                parent = this.super_.timer(name);
                return {
                    start: chain(function () {
                        timer = lynx.createTimer(name);
                        parent.start();
                    }),
                    end: chain(function () {
                        timer && timer.stop();
                        parent && parent.end();
                    })
                }
            }
        },

        gauge: {
            value:function (name, fn) {
                this.super_.gauge(name, fn);
                sample(function gauge() {
                    lynx.gauge(name, (typeof fn === 'function') ? fn() : fn);
                });
            }
        },

        meter: {
            value: function (name) {
                var meter = this.super_.meter(name);

                sample(function () {
                    var data = meter.sample();
                    lynx.gauge(name + '.mean', data.mean);
                    lynx.gauge(name + '.count', data.count);
                    lynx.gauge(name + '.currentRate', data.currentRate);
                    lynx.gauge(name + '.1MinuteRate', data['1MinuteRate']);
                    lynx.gauge(name + '.5MinuteRate', data['5MinuteRate']);
                    lynx.gauge(name + '.15MinuteRate', data['15MinuteRate']);
                });

                return {
                    mark: chain(meter.mark.bind(meter))
                };
            }
        }

    });
};