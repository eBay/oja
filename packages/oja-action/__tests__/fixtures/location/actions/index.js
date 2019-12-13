'use strict';

const { createContext } = require('@ebay/oja-action');

module.exports = async (name) => {
    const context = await createContext();
    return context.action(name);
};