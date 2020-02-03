'use strict';

const contextCounter = {};

module.exports = (context, config) => {
    contextCounter[config.action] = contextCounter[config.action] === undefined ? 0 : contextCounter[config.action];
    contextCounter[config.action]++;
    return async () => {
        return `${await context.action(config.action)}, context init: ${contextCounter[config.action]}`;
    }
};
