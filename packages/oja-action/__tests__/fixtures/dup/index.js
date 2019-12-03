'use strict';

// use relative path from .tmp/app folder
const { createContext } = require('@ebay/oja-action');

module.exports = async (name, ...args) => {
    const context = await createContext();
    return await context.action(name, ...args);
};