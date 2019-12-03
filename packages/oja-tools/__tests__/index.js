'use strict';

const Assert = require('assert');
const createContextFactory = require('@ebay/oja-action');

describe(__filename, () => {
    test('should call a pipeline of actions', async () => {
        const createContext = await createContextFactory();
        const context = await createContext();
        Assert.deepEqual(['x-qazv', 'x-barv', 'x-foov'], await context.action('PIPE-EXAMPLE/route', 'x-'));
        Assert.deepEqual(['y-qazv', 'y-barv', 'y-foov'], await context.action('PIPE-EXAMPLE/route', 'y-'));
        // parallel execution
        Assert.deepEqual([
            ['x-qazv', 'x-barv', 'x-foov'],
            ['y-qazv', 'y-barv', 'y-foov']
        ], await Promise.all([
            context.action('PIPE-EXAMPLE/route', 'x-'),
            context.action('PIPE-EXAMPLE/route', 'y-')
        ]));
    });
});