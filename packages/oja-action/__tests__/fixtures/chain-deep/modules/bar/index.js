'use strict';

module.exports = async context => {
    return `hello from bar and ${await context.action('DEEP/deep')}`;
};