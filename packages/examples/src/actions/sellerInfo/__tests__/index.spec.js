'use strict';

const Assert = require('assert');
const createContext = require('src/app-context');

describe(__filename, () => {
    test('action sellerInfo should fail', async () => {
        const context = await createContext({
            functions: {
                'ACTIONS/sellerInfo': new Error('BOOM')
            }
        });
        try {
            await context.action('ACTIONS/sellerInfo');
        }
        catch (err) {
            Assert.equal('BOOM', err.message);
        }
    });

    test('action sellerInfo should be called', async () => {
        const context = await createContext();
        Assert.deepEqual(require('mock-data/seller-info.json'),
            await context.action('ACTIONS/sellerInfo'));
    });

});