'use strict';

var Hapi = require('hapi'),
    assert = require('assert'),
    settings = require('./settings.json');

describe('metrics', function () {

    var server, requests;

    before(function (next) {

        server = new Hapi.Server();

        server.route({
            method: 'GET',
            path: '/test',
            handler: function (req) {
                req.reply('success').code(200);
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

    it('should incremement counters', function (next) {

        var count = 0;

        function makeRequest() {
            server.inject({
                method: 'get',
                url: 'http://localhost:3000/test'
            }, function (res) {
                assert.ok(res);
                assert.strictEqual(200, res.statusCode);

                if (++count < 99) {
                    setTimeout(makeRequest);
                }
                else {
                    done(res);
                }
            });
        }

        function done(res) {

            server.inject({
                method: 'get',
                url: 'http://localhost:3000/-/metrics'
            }, function (res) {
                assert.ok(res.payload);

                var metrics = JSON.parse(res.payload);

                //console.dir(metrics);

                assert.strictEqual(100, metrics.total);
                assert.strictEqual(1, metrics.active);
                assert.strictEqual(0, metrics.errors);
                assert.strictEqual(100, metrics.rps.count);
                assert.strictEqual(1, metrics.rss.count);
                assert.strictEqual(1, metrics.heapTotal.count);
                assert.strictEqual(1, metrics.heapUsed.count);

                next();
            });
        }

        makeRequest();
    });

});