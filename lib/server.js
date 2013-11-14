'use strict';

var multilevel = require('multilevel'),
    net = require('net'),
    levelup = require('levelup');

exports = module.exports = {
    create: function () {
        var db = levelup('./statsdb');
        return net.createServer(function (connection) {
            connection.pipe(multilevel.server(db)).pipe(connection);
        });
    }
};