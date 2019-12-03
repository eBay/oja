'use strict';

module.exports = context => {
    context.action('FOO/foo');
    context.action('BAR/bar'); // calling itself may be ok    
};
