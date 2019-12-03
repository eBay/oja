/* eslint-disable no-undef */
'use strict';

const Assert = require('assert');
const Path = require('path');
const Shell = require('shelljs');
const linter = require('@ebay/oja-linter');

describe(__filename, () => {
    const tmpBase = Path.resolve(__dirname, `.tmp-linter-simple`);
    const tmpDir = Path.resolve(tmpBase, `${Date.now()}`);
    const appDir = Path.resolve(tmpDir, 'app');

    // eslint-disable-next-line no-undef
    beforeAll(() => {
        Shell.rm('-rf', tmpBase);
        Shell.mkdir('-p', tmpDir);

        Shell.cp('-r', Path.resolve(__dirname, 'fixtures/app'), tmpDir);
        Shell.cd(appDir);
    });

    // eslint-disable-next-line no-undef
    afterAll(() => {
        Shell.rm('-rf', tmpBase);
    });

    test('should validate', async () => {
        const validate = await linter.createValidator();
        const errors = (await validate(Path.resolve(appDir, 'index.js')))
            .map(err => {
                err.path = err.path.substring(appDir.length);
                return err;
            });

        Assert.deepEqual(require('./fixtures/validation-expected.json'), errors.map(err => {
            if (err.message) {
                err.message = err.message.replace(appDir, '');
            }
            return err;
        }));
    });
});
