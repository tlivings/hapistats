'use strict';

var cluster = require('cluster'),
    service0 = require('service0'),
    measured = require('measured');

exports = module.exports = {

    create : function (metrics) {
        var service;

        if (cluster.isMaster) {
            if (!metrics) {
                metrics = measured.createCollection();
            }
            return service0.service(function (body, respond) {
                var metric;

                metric = metrics[body.type](body.name);

                metric[body.method].apply(metric, body.args);

                //Report back the JSON for this metric.
                respond(null, {
                    name: body.name,
                    json : metric.toJSON()
                });
            }).bind('ipc://metrics');
        }
    }

};
