'use strict';

// eslint-disable-next-line arrow-body-style
module.exports = context => async parameters => {
    return context.action({
        name: 'ACTIONS/itemDetails',
        foo: 'foov',
        '~bar': 'barv'
    }, context.itemId);
};
