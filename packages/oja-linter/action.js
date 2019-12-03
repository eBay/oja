'use strict';

const index = require('.');

module.exports = () => (command, ...args) => index[command](...args);
