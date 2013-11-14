'use strict';

var cluster = require('cluster'),
    server = require('./lib/server').create(),
    levelstats = require('./lib/levelstats'),
    pkg = require('./package.json'),
    name = pkg.name,
    version = pkg.version;

exports = module.exports = {

    name: name,

    version: version,

    register: function (plugin, options, next) {
        var hapi, settings, stats;

        hapi = plugin.hapi;

        settings = hapi.utils.applyToDefaults(require('./config/settings.json'), options);

        if (cluster.isMaster) {
            server.listen(settings.levelport || 3000);
        }

        stats = levelstats(settings);

        plugin.route({
            method: 'GET',
            vhost: settings.vhost,
            path: settings.path,
            handler: stats.handler
        });

        plugin.ext('onRequest', function (req, next) {
            stats.increment('requests.total');
            stats.increment('requests.active');
            next();
        });

        plugin.ext('onPreResponse', function (req, next) {
            var res = req.response();
            stats.decrement('requests.active');
            if (res._code >= 500) {
                stats.increment('response.errors');
            }
            next();
        });
    }
};