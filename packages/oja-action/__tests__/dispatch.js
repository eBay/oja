'use strict';

const Assert = require('assert');
const { createContext } = require('@ebay/oja-action');

describe(__filename, () => {
    it('should execute two actions via the same dispatcher with context init per action', async () => {
        const context = await createContext();
        const foo = await context.proxyAction(require.resolve('./fixtures/dispatch/dispatcher'), 'dispatcher/foo');
        const bar = await context.proxyAction(require.resolve('./fixtures/dispatch/dispatcher'), 'dispatcher/bar');
        Assert.equal(foo, 'hello from foo, context init: 1');
        Assert.equal(bar, 'hello from bar, context init: 1');
        Assert.equal(await context.proxyAction(
            require.resolve('./fixtures/dispatch/dispatcher'),
            'dispatcher/foo'), 'hello from foo, context init: 1');
        Assert.equal(await context.proxyAction(
            require.resolve('./fixtures/dispatch/dispatcher'),
            'dispatcher/bar'), 'hello from bar, context init: 1');
    });
});
