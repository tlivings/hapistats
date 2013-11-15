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
            vhost: settings.vhost,
            path: '/test',
            handler: function (req) {
                req.reply();
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
                url: 'http://localhost:3000/-/metrics'
            }, function (res) {
                assert.ok(res);
                assert.strictEqual(200, res.statusCode);

                if (++count < 100) {
                    setTimeout(makeRequest);
                }
                else {
                    done(res);
                }
            });
        }

        function done(res) {
            assert.ok(res.payload);

            var metrics = JSON.parse(res.payload)['http.requests'];

            assert.strictEqual(100, metrics.total.count);
            assert.strictEqual(1, metrics.active.count);
            assert.strictEqual(0, metrics.errors.count);
            assert.strictEqual(100, metrics.perSecond.count);
            //console.dir(metrics);
            next();
        }

        makeRequest();
    });

});