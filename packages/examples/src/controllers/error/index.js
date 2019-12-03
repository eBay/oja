'use strict';

const template = require('./index.marko');

/**
 * Action: error
 * Domain: controllers
 */
module.exports = context => {
    // put your action logic here
    // you can use async/await and return promise or dirrect object
    return {
        template,
        model: {
            error: 'Failed to handle your command'
        }
    };
};