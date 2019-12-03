'use strict';

// eslint-disable-next-line arrow-body-style
module.exports = context => async () => {
    // non-existent complex action request
    await context.action({
        name: 'ACTIONS/itemDetails',
        foo: 'foov',
        '~bar': 'barv'
    }, context.itemId);
    // valid action
    await context.action('oja/resolveAllActions');
    // non-existent
    await context.action({
        name: 'oja/some'
    });
    // circular action call to itself is bad
    await context.action('app/action');
    // non-existent
    await context.action('oja/nonExistent');
    // code not found
    await context.action('runtime/codeNotFound');
};
