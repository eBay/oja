'use strict';

const Assert = require('assert');
const { createContext } = require('@ebay/oja-action');

describe(__filename, () => {
    test('action itemDetails should fail', async () => {
        const context = await createContext({
            functions: {
                'ACTIONS/itemDetails': new Error('BOOM')
            }
        });
        try {
            await context.action('ACTIONS/itemDetails');
        }
        catch (err) {
            Assert.equal('BOOM', err.message);
        }
    });

    test('action itemDetails should be called', async () => {
        const context = await createContext();
        Assert.deepEqual(require('mock-data/item-details.json'),
            await context.action('ACTIONS/itemDetails'));
    });
});
