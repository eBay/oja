'use strict';

function done(count, next) {
    return function (err) {
        if (err) {
            return next(err);
        }
        count--;
        if (count === 0) {
            next();
        }
    };
}

module.exports = done;