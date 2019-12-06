/* eslint-disable no-undef */
'use strict';

const Assert = require('assert');
const Path = require('path');

describe(__filename, () => {
    test('should validate', async () => {
        const appDir = Path.resolve(__dirname, 'fixtures/duplicate');

        const { createContext } = require('@ebay/oja-action');
        const context = await createContext();

        const [errors] = await context.action('oja/lint', 'scan', appDir);

        Assert.deepEqual(require('./fixtures/validation-duplicate-expected.json'), errors.map(err => {
            err.files = err.files.map(file => file.replace(appDir, ''));
            return err;
        }));
    });
});
