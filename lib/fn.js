'use strict';


function kv(obj, fn) {
    Object.keys(obj).forEach(function (key) {
        fn(key, obj[key]);
    });
}

exports.chain = function chain(method) {
    return function () {
        method.apply(this, arguments);
        return this;
    };
};

exports.chainable = function chainable(obj) {
    kv(obj, function (key, value) {
        if (typeof value === 'function') {
            obj[key] = exports.chain(value);
        }
    });
    return obj;
};


exports.interval = function (interval) {
    return function (fn) {
        (function exec() {
            fn();
            setTimeout(exec, interval);
        }());
    };
};