'use strict';

const Assert = require('assert');
const Path = require('path');
const Shell = require('shelljs');

const {
    collectDuplicateActionErrors,
    getAllActions
} = require('../index');

describe(__filename, () => {
    const tmpBase = Path.resolve(__dirname, `.tmp-duplicate`);
    const tmpDir = Path.resolve(tmpBase, `${Date.now()}`);
    const appDir = Path.resolve(tmpDir, 'duplicate');

    // eslint-disable-next-line no-undef
    beforeAll(() => {
        Shell.rm('-rf', tmpBase);
        Shell.mkdir('-p', tmpDir);

        Shell.cp('-r', Path.resolve(__dirname, 'fixtures/duplicate'), tmpDir);
        Shell.cd(appDir);
    });

    // eslint-disable-next-line no-undef
    afterAll(() => {
        Shell.rm('-rf', tmpBase);
    });

    test('should detect duplicate actions', async () => {
        await getAllActions(appDir);
        const errors = (await collectDuplicateActionErrors(appDir)).map(err => {
            err.files = err.files.map(file => file.replace(appDir, ''));
            return err;
        });

        Assert.deepEqual(2, errors.length);
        Assert.deepEqual(require('./fixtures/duplicate/expected-errors.json'),
            errors);
    });
});
