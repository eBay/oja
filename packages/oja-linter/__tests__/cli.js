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
    const tmpBase = Path.resolve(__dirname, `.tmp-cli`);
    const tmpDir = Path.resolve(tmpBase, `${Date.now()}`);
    const appDir = Path.resolve(tmpDir, 'app');

    // eslint-disable-next-line no-undef
    beforeAll(() => {
        Shell.rm('-rf', tmpBase);
        Shell.mkdir('-p', tmpDir);

        Shell.cp('-r', Path.resolve(__dirname, 'fixtures/app'), tmpDir);
        Shell.cd(appDir);
        Fs.writeFileSync(Path.resolve(appDir, 'package.json'), JSON.stringify({
            'name': 'app',
            'version': '1.0.0',
            'license': 'MIT'
        }, null, 2));
        Assert.equal(0, Shell.exec(
            'yarn add ../../../../../oja-context  ../../../../../oja-action  ../../../../').code);
        
        // add more actions
        Shell.cp('-r', Path.resolve(__dirname, 'fixtures/modules'), appDir);
        Shell.cp('-r', Path.resolve(__dirname, 'fixtures/action-validation/complex'), appDir);
        Fs.writeFileSync(Path.resolve(appDir, 'index.js'), CODE);
    });

    // eslint-disable-next-line no-undef
    afterAll(() => {
        Shell.rm('-rf', tmpBase);
    });

    test('should scan via cli with color', () => {
        const output = Shell.exec(`cd ${appDir} && yarn ojalint ${appDir}`);
        Assert.equal(1, output.code);
        const outputMessage = output.stderr.replace(new RegExp(appDir, 'g'), '');

        Assert.equal(Fs.readFileSync(Path.resolve(
            __dirname, 'fixtures/cli/color-errors-expected.txt')).toString(),
        outputMessage);
    });

    test('should scan via cli without color', () => {
        process.env.OJA_LINT_NO_COLOR_OUTPUT = 'true';
        const output = Shell.exec(`cd ${appDir} && yarn ojalint ${appDir}`);
        Assert.equal(1, output.code);
        const outputMessage = output.stderr.replace(new RegExp(appDir, 'g'), '');

        Assert.equal(Fs.readFileSync(Path.resolve(
            __dirname, 'fixtures/cli/errors-expected.txt')).toString(),
        outputMessage);
    });

    test('should scan via cli without color and default folder', () => {
        process.env.OJA_LINT_NO_COLOR_OUTPUT = 'true';
        const output = Shell.exec(`cd ${appDir} && yarn ojalint`);
        Assert.equal(1, output.code);
        const outputMessage = output.stderr.replace(new RegExp(appDir, 'g'), '');

        Assert.equal(Fs.readFileSync(Path.resolve(
            __dirname, 'fixtures/cli/errors-expected.txt')).toString(),
        outputMessage);
    });

    test('should scan via cli with no errors', () => {
        Fs.writeFileSync(Path.resolve(appDir, '.ojalintignore'), '.*');
        const output = Shell.exec(`cd ${appDir} && yarn ojalint ${appDir}`);
        Assert.equal(0, output.code);
        const outputMessage = output.stderr.replace(new RegExp(appDir, 'g'), '');

        Assert.equal(Fs.readFileSync(Path.resolve(
            __dirname, 'fixtures/cli/no-errors-expected.txt')).toString(),
        outputMessage);
    });
});
