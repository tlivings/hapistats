'use strict';

var zmqsi = require('zmqsi'),
    measured = require('measured');

exports = module.exports = {

    create: function () {
        var client = zmqsi.client({ keepalive: true });

        //Wrap a proxy facade around the measured api to send to client.
        client.wrap = function (type, callback) {
            var Ctor;
            type = type[0].toUpperCase() + type.substring(1);
            Ctor = measured[type];

            return function (name) {
                var proxy = {};
                Object.keys(Ctor.prototype).forEach(function (key) {
                    proxy[key] = function () {
                        var args = Array.prototype.slice.call(arguments);
                        client.send('ipc://metrics', {
                            type : type.toLowerCase(),
                            name : name,
                            method : key,
                            args : args
                        }, callback);
                    };
                });
                return proxy;
            };
        };

        return client;
    }
};