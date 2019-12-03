'use strict';

// use relative path from .tmp/app folder
const createContextFactory = require('@ebay/oja-action');

module.exports = async (name, injectCtx) => {
    const createContext = await createContextFactory();
    const context = await createContext(injectCtx);
    return await context.action(name);
};