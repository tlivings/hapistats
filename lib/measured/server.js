'use strict';

var cluster = require('cluster'),
    zmqsi = require('zmqsi'),
    measured = require('measured');

exports = module.exports = {

    create : function (metrics) {
        var broker, service, cpus = require('os').cpus().length;

        if (cluster.isMaster) {
            if (!metrics) {
                metrics = measured.createCollection();
            }
        }

        function track(headers, body, respond) {
            var metric;

            metric = metrics[body.type](body.name);

            metric[body.method].apply(metric, body.args);

            //Report back the JSON for this metric.
            respond(null, {
                name: body.name,
                json : metric.toJSON()
            });
        }

        if (cluster.workers.length > 0) {
            if (cluster.isMaster) {
                broker = zmqsi.broker({ address: 'ipc://metrics', broadcast: 'ipc://workers' });
            }
            else {
                zmqsi.service(track).connect('ipc://workers');
            }
            return broker;
        }
        else {
            if (cluster.isMaster) {
                return zmqsi.service(track).bind('ipc://metrics');
            }
        }

        return broker;
    }

};
