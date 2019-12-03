'use strict';

const Assert = require('assert');
const createContext = require('src/app-context');

describe(__filename, () => {
    test('action error should fail', async () => {
        const context = await createContext({
            functions: {
                'CONTROLLERS/error': new Error('BOOM')
            }
        });
        try {
            await context.action('CONTROLLERS/error');
        }
        catch (err) {
            Assert.equal('BOOM', err.message);
        }
    });

    test('action error should be called', async () => {
        const context = await createContext();
        const view = await context.action('CONTROLLERS/error');
        Assert.deepEqual({
            error: 'Failed to handle your command'
        }, view.model);
    });
});