/* eslint-disable no-undef */
'use strict';

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');
const Shell = require('shelljs');
const linter = require('@ebay/oja-linter');

const CODE = `
'use strict';

// eslint-disable-next-line arrow-body-style
module.exports = context => async () => {
    // non-existent complex action request
    await context.action({
        name: 'ACTIONS/itemDetails',
        foo: 'foov',
        '~bar': 'barv'
    }, context.itemId);
    // valid action
    await context.action('oja/resolveAllActions');
    // non-existent
    // oja-lint-disable-next-line no-error
    await context.action({
        name: 'oja/some'
    });
    // circular action call to itself is bad
    // oja-lint-disable-next-line  no-warn
    await context.action('app/action');
    // non-existent
    await context.action('oja/nonExistent');
};
`;

describe(__filename, () => {
    const tmpBase = Path.resolve(__dirname, `.tmp-linter-ignore`);
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

    test('should scan app and ignore some errors when in-line comment commands are used', async () => {
        Fs.writeFileSync(Path.resolve(appDir, 'index.js'), CODE);
        console.warn = jest.fn();
        console.error = jest.fn();
        const [errors, errorCount] = await linter.scan(appDir);
        Assert.equal(3, errorCount);
        Assert.equal(3, errors.length);
        expect(console.error.mock.calls[0][0]).toMatch(/error: action "runtime\/codeNotFound" not found/);
        expect(console.error.mock.calls[1][0]).toMatch(/error: action "ACTIONS\/itemDetails" not found:/);
        expect(console.error.mock.calls[2][0]).toMatch(/error: action "oja\/nonExistent" not found:/);
    });
});
