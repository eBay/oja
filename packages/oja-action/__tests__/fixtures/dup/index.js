'use strict';

// use relative path from .tmp/app folder
const createContextFactory = require('@ebay/oja-action');

module.exports = async (name, ...args) => {
    const createContext = await createContextFactory();
    const context = await createContext();
    return await context.action(name, ...args);
};