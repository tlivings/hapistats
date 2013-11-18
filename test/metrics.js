/*global describe:false, before:false, after:false, it:false*/
'use strict';

var Hapi = require('hapi'),
    assert = require('chai').assert,
    settings = require('./settings.json');

describe('metrics', function () {

    var server;

    function repeat(count, fn, done) {
        (function run(err, data) {
            count -= 1;
            if (!count) {
                done(err, data);
                return;
            }
            fn(run);
        })();
    }

    before(function (next) {
        server = new Hapi.Server();

        server.route({
            method: 'get',
            path: '/test',
            handler: function (req) {
                setTimeout(function () {
                    req.reply('success').code(200);
                }, 5);
            }
        });

        server.pack.require('../', settings, next);
    });


    after(function () {
        server.stop();
    });


    it('should increment counters', function (done) {

        function inject(done) {
            server.inject({
                method: 'get',
                url: 'http://localhost:3000/test'
            }, function (res) {
                assert.ok(res);
                assert.strictEqual(res.statusCode, 200);
                done();
            });
        }

        function tabulate() {
            server.inject({
                method: 'get',
                url: 'http://localhost:3000/-/metrics'
            }, function (res) {
                var metrics;

                assert.ok(res.result);
                metrics = res.result;

                assert.strictEqual(metrics.total, 99);
                assert.strictEqual(metrics.active, 1);
                assert.strictEqual(metrics.errors, undefined);
                assert.strictEqual(metrics.rps.count, 99);
                assert.isObject(metrics.walltime);
                /*
                assert.isNumber(metrics.rss);
                assert.isNumber(metrics.heapTotal);
                assert.isNumber(metrics.heapUsed);
                 */
                done();
            });
        }

        repeat(100, inject, tabulate);

    });

});