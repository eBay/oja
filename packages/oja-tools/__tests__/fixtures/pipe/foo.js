'use strict';

module.exports = context => async (pre, next) => {
    const result = await next();
    return [...result, pre+'foov'];
}