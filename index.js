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

        rss = metrics.histogram('rss');
        heapTotal = metrics.histogram('heapTotal');
        heapUsed = metrics.histogram('heapUsed');

        function calculateMemory() {
            var memory = process.memoryUsage();
            rss.update(memory.rss);
            heapTotal.update(memory.heapTotal);
            heapUsed.update(memory.heapUsed);
            setTimeout(calculateMemory, settings.memoryInterval || 10000);
        }

        calculateMemory();

        plugin.route({
            method: 'GET',
            vhost: settings.vhost,
            path: settings.path,
            handler: function (req) {
                req.reply(metrics.toJSON());
            }
        });

        plugin.ext('onRequest', function (req, next) {
            rps.mark();
            httpTotal.inc();
            httpActive.inc();
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