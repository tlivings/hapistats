'use strict';

var measured = require('measured'),
    fn = require('../fn'),
    chain = fn.chain,
    cluster = require('cluster'),
    service0 = require('service0');

exports = module.exports = function () {

    var metrics,
        proxy,
        service,
        _json = {};

    if (cluster.isMaster) {
        if (!metrics) {
            metrics = measured.createCollection();
        }
        service = service0.service(function (body, respond) {
            var metric;

            if (body.type && body.name) {
                metric = metrics[body.type](body.name);

                metric[body.method].apply(metric, body.args);

                //Report back the JSON for this metric.
                respond(null, {
                    name: body.name,
                    json : metric.toJSON()
                });
            }
            else {
                respond(null, metrics[body.method]());
            }
        });

        service.bindSync('ipc://metrics');
    }

    //Wrap a proxy facade around the measured api to send to client.
    function wrap(type, callback) {
        var Ctor, client;
        type = type[0].toUpperCase() + type.substring(1);
        Ctor = measured[type];

        client = service0.client('ipc://metrics');

        return function (name) {
            var proxy = {};
            Object.keys(Ctor.prototype).forEach(function (key) {
                proxy[key] = function () {
                    var args = Array.prototype.slice.call(arguments);
                    client.send({
                        type : type.toLowerCase(),
                        name : name,
                        method : key,
                        args : args
                    }, callback);
                };
            });
            return proxy;
        };
    }

    function onmessage(error) {
        if (error) {
            throw new Error(error.name, error.message);
        }
    }

    proxy = {
        _json : {},

        counter: wrap('counter', onmessage),

        timer: wrap('timer', onmessage),

        gauge: function (name, fn) {
            var value = fn;
            if (typeof fn !== 'function') {
                value = function () {
                    return fn;
                };
            }
            metrics.gauge(name, value);
        },

        meter: metrics.meter.bind(metrics),

        toJSON : function (callback) {
            var client;

            client = service0.client('ipc://metrics');

            client.send({ method : 'toJSON' }, function (error, message) {
                if (error) {
                    throw new Error(error.name, error.message);
                }
                callback(message);
                client.close();
            });
        }
    };

    return proxy;
};