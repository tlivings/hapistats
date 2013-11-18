'use strict';

var zmq = require('zmq'),
    measured = require('measured');

exports = module.exports = {

    create : function (metrics) {
        var client;

        //Worker process, use zeromq.
        if (!metrics) {
            client = new zmq.socket('req');

            client.connect('ipc://metrics');

            client.onMessage = function (fn) {
                client.on('message', fn.bind(client));
            }
        }
        else {
            //Writes directly to measured but acts sort of like zeromq.
            client = {
                _onMessage : undefined,
                send : function (data) {
                    data = JSON.parse(data);

                    var metric = metrics[data.type](data.name);

                    metric[data.method].apply(metric, data.args);

                    if (this._onMessage) {
                        setImmediate(this._onMessage.bind(this, JSON.stringify({
                            name : data.name,
                            json : metric.toJSON()
                        })));
                    }
                },
                onMessage : function (fn) {
                    this._onMessage = fn.bind(this);
                }
            }
        }

        //Wrap a proxy facade around the measured api to send to client.
        client.wrap = function (type) {
            var Ctor;
            type = type[0].toUpperCase() + type.substring(1);
            Ctor = measured[type];

            return function (name) {
                var proxy = {};
                Object.keys(Ctor.prototype).forEach(function (key) {
                    proxy[key] = function () {
                        var args = Array.prototype.slice.call(arguments);
                        client.send(JSON.stringify({
                            type : type.toLowerCase(),
                            name : name,
                            method : key,
                            args : args
                        }));
                    };
                });
                return proxy;
            }
        };

        return client;
    }

}