'use strict';

var pkg = require('./package.json'),
    name = pkg.name,
    version = pkg.version;

exports = module.exports = {

    name: name,

    version: version,

    register: function (plugin, options, done) {
        var hapi, settings, metrics, httpTotal, httpActive, httpErrors, rps;

        hapi = plugin.hapi;

        settings = hapi.utils.applyToDefaults(require('./config/settings.json'), options);

        metrics = require('./lib/metrics')(settings);

        httpTotal = metrics.createCounter('http.requests.total');
        httpActive = metrics.createCounter('http.requests.active');
        httpErrors = metrics.createCounter('http.requests.errors');

        rps = metrics.createMeter('http.requests.perSecond');

        plugin.route({
            method: 'GET',
            vhost: settings.vhost,
            path: settings.path,
            handler: metrics.handler
        });

        plugin.ext('onRequest', function (req, next) {
            httpTotal.increment();
            httpActive.increment();
            rps.mark();
            next();
        });

        plugin.ext('onPreResponse', function (req, next) {
            var res = req.response();
            httpActive.decrement();
            if (res._code >= 500) {
                httpErrors.increment();
            }
            next();
        });

        done();
    }
};