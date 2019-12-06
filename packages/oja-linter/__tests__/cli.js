/* eslint-disable no-undef */
'use strict';

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');
const Shell = require('shelljs');

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
    const tmpBase = Path.resolve(__dirname, `.tmp-cli`);
    const tmpDir = Path.resolve(tmpBase, `${Date.now()}`);
    const appDir = Path.resolve(tmpDir, 'app');

    // eslint-disable-next-line no-undef
    beforeAll(() => {
        Shell.rm('-rf', tmpBase);
        Shell.mkdir('-p', tmpDir);

        Shell.cp('-r', Path.resolve(__dirname, 'fixtures/app'), tmpDir);
        Shell.cd(appDir);

        // add more actions
        Shell.cp('-r', Path.resolve(__dirname, 'fixtures/modules'), appDir);
        Shell.cp('-r', Path.resolve(__dirname, 'fixtures/action-validation/complex'), appDir);
        Fs.writeFileSync(Path.resolve(appDir, 'index.js'), CODE);
    });

    // eslint-disable-next-line no-undef
    afterAll(() => {
        Shell.rm('-rf', tmpBase);
    });

    function outputToJson(output) {
        return output
            .replace(new RegExp(appDir, 'g'), '')
            .split(/[\n\r\t]/)
            .filter(item => !!item)
            .map(item => item.trim());
    }

    test('should scan via cli with color', () => {
        process.env.OJA_LINT_NO_COLOR_OUTPUT = 'false';
        const cmd = `node --require ${
            Path.resolve(appDir, 'bootstrap.js')} ${
            Path.resolve(__dirname, '../bin/lint')} ${appDir}`;
        const output = Shell.exec(cmd);
        Assert.equal(1, output.code);
        const messageOutput = outputToJson(output.stderr);

        Assert.deepEqual(require('./fixtures/cli/color-errors-expected.json'),
            messageOutput);
    });

    test('should scan via cli without color', () => {
        process.env.OJA_LINT_NO_COLOR_OUTPUT = 'true';
        const cmd = `node --require ${
            Path.resolve(appDir, 'bootstrap.js')} ${
            Path.resolve(__dirname, '../bin/lint')} ${appDir}`;
        const output = Shell.exec(cmd);
        Assert.equal(1, output.code);
        const messageOutput = outputToJson(output.stderr);

        Assert.deepEqual(require('./fixtures/cli/errors-expected.json'),
            messageOutput);
    });

    test('should scan via cli without color and default folder', () => {
        process.env.OJA_LINT_NO_COLOR_OUTPUT = 'true';
        const cmd = `cd ${appDir} && node --require ${
            Path.resolve(appDir, 'bootstrap.js')} ${
            Path.resolve(__dirname, '../bin/lint')}`;
        const output = Shell.exec(cmd);
        Assert.equal(1, output.code);
        const messageOutput = outputToJson(output.stderr);

        Assert.deepEqual(require('./fixtures/cli/errors-expected.json'),
            messageOutput);
    });

    test('should scan via cli with no errors', () => {
        Fs.writeFileSync(Path.resolve(appDir, '.ojalintignore'), '.*');
        const cmd = `node --require ${
            Path.resolve(appDir, 'bootstrap.js')} ${
            Path.resolve(__dirname, '../bin/lint')} ${appDir}`;
        const output = Shell.exec(cmd);
        Assert.equal(0, output.code);
    });
});
