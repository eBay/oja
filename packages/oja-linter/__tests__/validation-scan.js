/* eslint-disable no-undef */
'use strict';

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');
const Shell = require('shelljs');
const linter = require('@ebay/oja-linter');

describe(__filename, () => {
    const tmpBase = Path.resolve(__dirname, `.tmp-linter-scan`);
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

    test('should scan app', async () => {
        console.warn = jest.fn();
        console.error = jest.fn();
        const [errors, errorCount] = await linter.scan(appDir);

        Assert.equal(5, errorCount);
        Assert.equal(6, errors.length);
        expect(console.warn.mock.calls[0][0]).toMatch(/warn: circular call of "app\/action" action:/);

        expect(console.error.mock.calls[0][0]).toMatch(
            /error: action "runtime\/codeNotFound" not found.+app\/action\.json:3,4/);
        expect(console.error.mock.calls[1][0]).toMatch(/error: action "ACTIONS\/itemDetails" not found:/);
        expect(console.error.mock.calls[2][0]).toMatch(/error: action "oja\/some" not found:/);
        expect(console.error.mock.calls[3][0]).toMatch(/error: action "oja\/nonExistent" not found:/);
        expect(console.error.mock.calls[4][0]).toMatch(
            /error: action "runtime\/codeNotFound" not found.+app\/index\.js:22,25/);

        console.warn = jest.fn();
        console.error = jest.fn();
        process.exit = jest.fn();
        Assert.equal(undefined, await linter.scan(appDir, true));

        expect(console.warn.mock.calls[0][0]).toMatch(/warn: circular call of "app\/action" action:/);

        expect(console.error.mock.calls[0][0]).toMatch(
            /error: action "runtime\/codeNotFound" not found.+app\/action\.json:3,4/);
        expect(console.error.mock.calls[1][0]).toMatch(/error: action "ACTIONS\/itemDetails" not found:/);
        expect(console.error.mock.calls[2][0]).toMatch(/error: action "oja\/some" not found:/);
        expect(console.error.mock.calls[3][0]).toMatch(/error: action "oja\/nonExistent" not found:/);
        expect(console.error.mock.calls[4][0]).toMatch(
            /error: action "runtime\/codeNotFound" not found.+app\/index\.js:22,25/);
        expect(process.exit.mock.calls[0][0]).toEqual(1);

        // one error
        Fs.writeFileSync(Path.join(appDir, 'index.js'), 'module.exports = () => { context.action("Notfound") }');
        process.exit = jest.fn();
        Assert.equal(undefined, await linter.scan(appDir, true));
        expect(process.exit.mock.calls[0][0]).toEqual(1);

        // parse error
        Fs.writeFileSync(Path.join(appDir, 'index.js'), 'function (match) => { var [,last] = match; }');
        process.exit = jest.fn();
        Assert.equal(undefined, await linter.scan(appDir, true));
        expect(process.exit.mock.calls[0][0]).toEqual(1);

        // unexpected error
        const filePath = Path.join(appDir, 'index.js');
        Fs.writeFileSync(filePath, 'function () => {}');
        process.exit = jest.fn();
        const _readFileSync = Fs.readFileSync;
        Fs.readFileSync = (...args) => {
            if (args[0] === filePath) {
                throw new Error('BOOM');
            }
            return _readFileSync.apply(Fs, args);
        };
        Assert.equal(undefined, await linter.scan(appDir, true));
        expect(process.exit.mock.calls[0][0]).toEqual(1);
        Fs.readFileSync = _readFileSync;

        // error ignore via inline command
        Fs.writeFileSync(Path.join(appDir, 'index.js'), `module.exports = () => {
            // oja-lint-disable-next-line no-error
            context.action("Notfound");
        }`);
        process.exit = jest.fn();
        Fs.writeFileSync(Path.resolve(appDir, '.ojalintignore'), 'action.json');
        Assert.equal(undefined, await linter.scan(appDir, true));
        expect(process.exit.mock.calls[0][0]).toEqual(0);

        Fs.writeFileSync(Path.join(appDir, 'index.js'), 'module.exports = () => {}');
        process.exit = jest.fn();
        Fs.writeFileSync(Path.resolve(appDir, '.ojalintignore'), '.*');
        Assert.equal(undefined, await linter.scan(appDir, true));
        expect(process.exit.mock.calls[0][0]).toEqual(0);
    });
});
