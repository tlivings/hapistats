/*global describe:false, before:false, after:false, it:false*/
'use strict';

var Hapi = require('hapi'),
    assert = require('chai').assert,
    settings = require('./settings.json');

describe('metrics', function () {

    var server, requests;

    before(function (next) {

        server = new Hapi.Server();

        server.route({
            method: 'GET',
            path: '/test',
            handler: function (req) {
                setTimeout(function () {
                    req.reply('success').code(200);
                }, 5);
            }
        });

        server.pack.require('../', settings, function (err) {
            assert.ok(!err);
            next();
        });

    });

    after(function () {
        server.stop();
    });

    function repeat(count, fn, done) {
        var index = 0;
        (function complete(err, data) {
            index += 1;
            if (index === count) {
                done(err, data);
                return;
            }
            fn(complete);
        })();
    }

    function inject(done) {
        server.inject({
            method: 'get',
            url: 'http://localhost:3000/test'
        }, function (res) {
            assert.ok(res);
            assert.strictEqual(200, res.statusCode);
            done();
        });
    }

    it('should increment counters', function (done) {

        repeat(100, inject, function () {
            server.inject({
                method: 'get',
                url: 'http://localhost:3000/-/metrics'
            }, function (res) {
                var metrics;

                assert.ok(res.result);
                metrics = res.result;

                assert.strictEqual(100, metrics.total);
                assert.strictEqual(1, metrics.active);
                assert.strictEqual(0, metrics.errors);
                assert.strictEqual(100, metrics.rps.count);
                assert.isNumber(metrics.rss);
                assert.isNumber(metrics.heapTotal);
                assert.isNumber(metrics.heapUsed);

                done();
            });
        });
    });

});