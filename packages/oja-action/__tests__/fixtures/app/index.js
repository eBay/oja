'use strict';

// use relative path from .tmp/app folder
const { createContext } = require('@ebay/oja-action');

module.exports = async (name, injectCtx) => {
    const context = await createContext(injectCtx);
    return await context.action(name);
};