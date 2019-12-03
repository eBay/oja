'use strict';

const Assert = require('assert');
const createContext = require('src/app-context');

describe(__filename, () => {
    test('action calculateRates should fail', async () => {
        const context = await createContext({
            functions: {
                'ACTIONS/calculateRates': new Error('BOOM')
            }
        });
        try {
            await context.action('ACTIONS/calculateRates');
        }
        catch (err) {
            Assert.equal('BOOM', err.message);
        }
    });

    test('action calculateRates should be called', async () => {
        const context = await createContext();
        Assert.deepEqual(require('mock-data/shipping-info.json'),
            await context.action('ACTIONS/calculateRates'));
    });

});