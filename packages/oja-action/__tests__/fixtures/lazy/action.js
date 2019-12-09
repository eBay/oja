'use strict';

module.exports = context => {
    let counter = 0;
    return () => {
        counter++;
        return counter;
    };
};