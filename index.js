'use strict';

var measured = require('./lib/measured'),
    statsd = require('./lib/statsd'),
    pkg = require('./package.json'),
    name = pkg.name,
    version = pkg.version;

exports = module.exports = {

    name: name,

    version: version,

    register: function (plugin, options, done) {
        var hapi, settings, metrics, httpTotal, httpActive, httpErrors, rps, rss, heapTotal, heapUsed;

        hapi = plugin.hapi;
        settings = hapi.utils.applyToDefaults(require('./config/settings.json'), options);

        metrics = measured.create(settings);

        if (typeof settings.statsd === 'object') {
            metrics = statsd.create(metrics, settings.statsd);
        }

        httpTotal = metrics.counter('total');
        httpActive = metrics.counter('active');
        httpErrors = metrics.counter('errors');
        rps = metrics.meter('rps');

        rss = metrics.gauge('rss', function () {
            return process.memoryUsage().rss;
        });

        heapTotal = metrics.gauge('heapTotal', function () {
            return process.memoryUsage().heapTotal;
        });

        heapUsed = metrics.gauge('heapUsed', function () {
            return process.memoryUsage().heapUsed;
        });

        plugin.route({
            method: 'get',
            vhost: settings.vhost,
            path: settings.path,
            handler: function (req) {
                req.reply(metrics.toJSON());
            }
        });

        plugin.ext('onPreHandler', function (req, next) {
            var timer;

            rps.mark();
            httpTotal.inc();
            httpActive.inc();

            timer = (metrics.timer('walltime')).start();
            req.raw.res.on('finish', timer.end.bind(timer));

            next();
        });

        plugin.ext('onPreResponse', function (req, next) {
            httpActive.dec();
            if (req.response()._code >= 500) {
                httpErrors.inc();
            }
            next();
        });

        done();
    }
};