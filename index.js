'use strict';

var pkg = require('./package.json'),
    name = pkg.name,
    version = pkg.version;

exports = module.exports = {

    name: name,

    version: version,

    register: function (plugin, options, done) {
        var hapi, settings, metrics;

        hapi = plugin.hapi;

        settings = hapi.utils.applyToDefaults(require('./config/settings.json'), options);

        metrics = require('./lib/metrics')(settings);

        metrics.createCounter('http.requests.total');
        metrics.createCounter('http.requests.active');
        metrics.createCounter('http.requests.errors');

        metrics.createMeter('http.requests.perSecond');

        plugin.route({
            method: 'GET',
            vhost: settings.vhost,
            path: settings.path,
            handler: metrics.handler
        });

        plugin.ext('onRequest', function (req, next) {
            metrics.increment('http.requests.total');
            metrics.increment('http.requests.active');
            metrics.mark('http.requests.perSecond');
            next();
        });

        plugin.ext('onPreResponse', function (req, next) {
            var res = req.response();
            metrics.decrement('http.requests.active');
            if (res._code >= 500) {
                metrics.increment('http.response.errors');
            }
            next();
        });

        done();
    }
};