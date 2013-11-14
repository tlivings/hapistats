'use strict';

var pkg = require('./package.json'),
    name = pkg.name,
    version = pkg.version,
    stats = require('./lib/stats');

exports = module.exports = {

    name: name,

    version: version,

    register: function (plugin, options, next) {
        var hapi = plugin.hapi,
            settings = hapi.utils.applyToDefaults(require('./config/settings.json'), options);

        plugin.route({
            method: 'GET',
            vhost: settings.vhost,
            path: settings.path,
            handler: stats.handler
        });


        plugin.ext('onRequest', function (req, next) {
            stats.increment('requests:total');
            stats.increment('requests:active');
            next();
        });

        plugin.ext('onPreResponse', function (req, next) {
            var res = req.response();
            stats.decrement('requests:active');
            if (res._code >= 500) {
                stats.increment('response:errors');
            }
            next();
        });

    }
};