'use strict';

var zmq = require('zmq'),
    measured = require('measured');

exports = module.exports = {

    create : function (metrics) {
        var socket = new zmq.socket('rep');

        if (!metrics) {
            metrics = measured.createCollection();
        }

        socket.bindSync('ipc://metrics');

        socket.on('message', function (data) {
            var metric;

            data = JSON.parse(data);

            metric = metrics[data.type](data.name);

            metric[data.method].apply(metric, data.args);

            //Report back the JSON for this metric.
            socket.send(JSON.stringify({
                name : data.name,
                json : metric.toJSON()
            }));
        });

        return socket;
    }

}
