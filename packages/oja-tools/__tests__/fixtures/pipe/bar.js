'use strict';

module.exports = context => async (pre, next) => {
    const result = await next('n-');
    return [...result, pre+'barv'];
}