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
    const tmpBase = Path.resolve(__dirname, `.tmp-linter-subfolders`);
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

    test('should scan more complex app with sub folders', async () => {
        // add more actions
        Shell.cp('-r', Path.resolve(__dirname, 'fixtures/modules'), appDir);
        Shell.cp('-r', Path.resolve(__dirname, 'fixtures/action-validation/complex'), appDir);
        Fs.writeFileSync(Path.resolve(appDir, 'index.js'), CODE);
        console.warn = jest.fn();
        console.error = jest.fn();
        const [errors, errorCount] = await linter.scan(appDir);

        Assert.equal(5, errorCount);
        Assert.equal(6, errors.length);
        Assert.deepEqual(require('./fixtures/validation-subfolders/expected-errors.json'),
            errors.map(err => {
                err.path = err.path.replace(tmpDir, '');
                if (err.message) {
                    err.message = err.message.replace(tmpDir, '');
                }
                return err;
            }));

        expect(console.error.mock.calls[0][0]).toMatch(
            /error: action "WSX\/wsx" not found:.+app\/complex\/action\.json:2,4/);
        expect(console.error.mock.calls[1][0]).toMatch(
            /error: action "runtime\/codeNotFound" not found/);
        expect(console.error.mock.calls[2][0]).toMatch(
            /error: action "QAZ\/qaz" not found:.+app\/complex\/action\.json:10,4/);
        expect(console.error.mock.calls[3][0]).toMatch(
            /error: action "ACTIONS\/itemDetails" not found:.+index\.js:8,14/);
        expect(console.error.mock.calls[4][0]).toMatch(
            /error: action "oja\/nonExistent" not found:.+app\/index\.js:23,25/);
        expect(console.warn.mock.calls[0][0]).toMatch(/warn: circular call of "BAR\/bar" action:/);
    });
});
