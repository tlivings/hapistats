'use strict';

var multilevel = require('multilevel'),
    net = require('net'),
    os = require('os'),
    util = require('./util');

exports = module.exports = function (options) {
    options = options || {};

    var os_stats = options.os_stats || ['hostname', 'loadavg', 'totalmem', 'freemem'],
        db = multilevel.client(),
        con = net.connect(options.levelport || 3000);

    con.pipe(db.createRpcStream()).pipe(con);

    function level(fn) {
        function put(name, value) {
            db.put(name, value);
        }
        return function (name) {
            db.get(name, function (error, value) {
                fn(value, put.bind(null, name));
            });
        };
    }

    return {

        handler: function (req) {
            //This doesn't work for some reason.
            req.reply(db.createReadStream({ keys: true, values: true }));
        },

        increment: level(function (value, save) {
            value = parseInt(value) || 0;
            save(value + 1);
        }),

        decrement: level(function (value, save) {
            value = parseInt(value) || 0;
            save(value - 1);
        })

    };
};

/*
TODO

function calculate() {
    OS_STATS.reduce(function (data, stat) {
        data[stat] = os[stat]();
        return data;
    }, data);

    data.memoryUsage = process.memoryUsage();

    var samples = util.map(samples, function (value) {
        if (typeof value === 'function') {
            return value();
        }
        return value;
    });

    setTimeout(calculate, 5000);
}

calculate();

 */
