'use strict';

module.exports = async context => {
    return `hello from deep and ${await context.action('QAZNS/qaz')}`;
};