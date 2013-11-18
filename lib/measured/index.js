'use strict';

var measured = require('measured'),
    fn = require('../fn'),
    chain = fn.chain,
    cluster = require('cluster'),
    Server = require('./server'),
    Client = require('./client');

exports.create = function () {

    var metrics = measured.createCollection(), server, client, proxy, _json = {};

    server = Server.create();
    client = Client.create();

    function onmessage(error, headers, body) {
        _json[body.name] = body.json;
    }

    proxy = {
        _json : {},

        counter: client.wrap('counter', onmessage),

        timer: client.wrap('timer', onmessage),

        gauge: function (name, fn) {
            var value = fn;
            if (typeof fn !== 'function') {
                value = function () {
                    return fn;
                };
            }
            metrics.gauge(name, value);
        },

        meter: client.wrap('meter', onmessage),

        toJSON : function () {
            return _json;
        }
    };

    return proxy;
};