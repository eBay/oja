'use strict';

const Assert = require('assert');
const { createContext } = require('@ebay/oja-action');

describe(__filename, () => {
    test('should call a pipeline of actions', async () => {
        const context = await createContext();
        Assert.deepEqual(['n-qazv', 'x-barv', 'x-foov'], await context.action('PIPE-EXAMPLE/route', 'x-'));
        Assert.deepEqual(['n-qazv', 'y-barv', 'y-foov'], await context.action('PIPE-EXAMPLE/route', 'y-'));
        // parallel execution
        Assert.deepEqual([
            ['n-qazv', 'x-barv', 'x-foov'],
            ['n-qazv', 'y-barv', 'y-foov']
        ], await Promise.all([
            context.action('PIPE-EXAMPLE/route', 'x-'),
            context.action('PIPE-EXAMPLE/route', 'y-')
        ]));
    });
});