'use strict';

const Assert = require('assert');
const createContext = require('src/app-context');

describe(__filename, () => {
    test('action userDetails should fail', async () => {
        const context = await createContext({
            functions: {
                'ACTIONS/userDetails': new Error('BOOM')
            }
        });
        try {
            await context.action('ACTIONS/userDetails');
        }
        catch (err) {
            Assert.equal('BOOM', err.message);
        }
    });

    test('action userDetails should be called', async () => {
        const context = await createContext();
        Assert.deepEqual(require('mock-data/user-info.json'),
            await context.action('ACTIONS/userDetails'));
    });

});