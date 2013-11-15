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

    function fetch(fn) {
        function put(name, value) {
            var expectedVersion = value.version;
            //First refetch to make sure nobody else modified.
            db.get(name, function (error, revalue) {
                revalue = versionedValue(revalue);
                //Versions don't match
                if (expectedVersion !== revalue.version) {
                    //Replay
                    setImmediate(fn.bind(null, revalue));
                }
                else {
                    //We're good
                    db.put(name, value);
                }
            });
        }
        return function (name) {
            db.get(name, function (error, value) {
                value = versionedValue(value);
                fn(value, put.bind(null, name));
            });
        };
    }

    return {

        handler: function (req) {
            //TODO: This doesn't work for some reason.
            req.reply(db.createReadStream({ keys: true, values: true }));
        },

        increment: fetch(function (value, save) {
            value.value++;
            save(versionedValue(value));
        }),

        decrement: fetch(function (value, save) {
            value.value--;
            save(versionedValue(value));
        })

    };
};

function versionedValue(value) {
    if (!value) {
        value =  {
            value: value,
            version: 0
        };
    }
    value.version++;
    return value;
}

/*
TODO:

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
