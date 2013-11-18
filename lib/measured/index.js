'use strict';

var measured = require('measured'),
    fn = require('../fn'),
    chain = fn.chain,
    cluster = require('cluster'),
    Server = require('./server'),
    Client = require('./client');

exports.create = function () {

    var metrics = measured.createCollection(), server, client, proxy;

    if (cluster.isMaster) {
        server = Server.create();
        client = Client.create(metrics);
    }
    else {
        client = Client.create();
    }

    client.onMessage(function (data) {
        data = JSON.parse(data);
        proxy._json[data.name] = data.json;
    });

    proxy = {
        _json : {},

        counter : client.wrap('counter'),

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

        meter : client.wrap('meter'),

        toJSON : function () {
            return this._json;
        }
    }

    return proxy;
};