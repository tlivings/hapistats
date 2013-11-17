'use strict';

exports.chain = function chain(method) {
    return function () {
        method.apply(this, arguments);
        return this
    }
};

exports.interval = function (interval) {
    return function (fn) {
        (function exec() {
            fn();
            setTimeout(exec, interval);
        }());
    };
};