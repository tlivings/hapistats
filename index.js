'use strict';

var pkg = require('./package.json'),
    name = pkg.name,
    version = pkg.version;

exports = module.exports = {

    name: name,

    version: version,

    register: function (plugin, options, done) {
        var hapi, settings, metrics, httpTotal, httpActive, httpErrors, rps, rss, heapTotal, heapUsed;

        hapi = plugin.hapi;
        settings = hapi.utils.applyToDefaults(require('./config/settings.json'), options);
        metrics = require('./lib/metrics')(settings);

        httpTotal = metrics.counter('total');
        httpActive = metrics.counter('active');
        httpErrors = metrics.counter('errors');
        rps = metrics.meter('rps');

        rss = metrics.gauge('rss', function () {
            return process.memoryUsage().rss;
        });

        heapTotal = metrics.gauge('heapTotal', function () {
            return process.memoryUsage().rss;
        });

        heapUsed = metrics.gauge('heapUsed', function () {
            return process.memoryUsage().rss;
        });

        plugin.route({
            method: 'get',
            vhost: settings.vhost,
            path: settings.path,
            handler: function (req) {
                req.reply(metrics.toJSON());
            }
        });

        plugin.ext('onRequest', function (req, next) {
            var timer;

            rps.mark();
            httpTotal.inc();
            httpActive.inc();

            timer = (metrics.timer('walltime')).start();
            req.raw.res.on('finish', timer.end.bind(timer));

            next();
        });

        plugin.ext('onPreResponse', function (req, next) {
            var res = req.response();
            httpActive.dec();
            if (res._code >= 500) {
                httpErrors.inc();
            }
            next();
        });

        done();
    }
};