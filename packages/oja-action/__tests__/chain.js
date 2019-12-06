/* eslint-disable no-undef */
'use strict';

const Fs = require('fs');
const Path = require('path');
const Shell = require('shelljs');

describe(__filename, () => {
    const tmpBase = Path.resolve(__dirname, '.tmp-chain');
    const tmpDir = Path.resolve(tmpBase, `${Date.now()}`);

    function createMockModule(name, modRoot, nextName, skipDep) {
        modRoot = Path.resolve(modRoot, 'node_modules', name);
        Shell.mkdir('-p', modRoot);
        const pkg = {
            name,
            version: '1.0.0',
            main: './index',
            dependencies: {}
        };
        if (!skipDep) {
            pkg.dependencies[nextName] = '1.0.0';
        }
        Fs.writeFileSync(`${modRoot}/package.json`, JSON.stringify(pkg));
        const ns = `${name.toUpperCase()}NS/${name}`;
        const actionJson = {};
        actionJson[ns] = '.';
        Fs.writeFileSync(`${modRoot}/action.json`, JSON.stringify(actionJson));
        const tail = nextName && ` and \${await context.action('${
            nextName.toUpperCase()}NS/${
            nextName}')}` || '';
        Fs.writeFileSync(`${modRoot}/index.js`,
            `module.exports = async context => \`hello from ${name}${tail}\`;`);
        return modRoot;
    }

    beforeEach(() => {
        Shell.rm('-rf', tmpBase);
        Shell.mkdir('-p', tmpDir);
    });

    afterEach(() => {
        Shell.rm('-rf', tmpBase);
    });

    test('should discover action as actions are called', async () => {
        const appDir = Path.resolve(tmpDir, 'chain-deep');
        Shell.cp('-r', Path.resolve(__dirname, 'fixtures/chain-deep'), tmpDir);
        let nextRoot = createMockModule('qaz', appDir, 'wsx');
        nextRoot = createMockModule('wsx', nextRoot, 'edc');
        nextRoot = createMockModule('edc', nextRoot, 'rfv');
        createMockModule('rfv', nextRoot);

        const act = require(appDir);
        expect(await act('BARNS/bar'))
            .toEqual('hello from bar and hello from deep and hello from qaz' +
            ' and hello from wsx and hello from edc and hello from rfv');
    });

    test('should be able to access app actions from module action', async () => {
        const appDir = Path.resolve(tmpDir, 'chain');
        Shell.cp('-r', Path.resolve(__dirname, 'fixtures/chain'), tmpDir);
        createMockModule('qaz', appDir, 'deep', true);

        const act = require(appDir);
        expect(await act('QAZNS/qaz')).toEqual('hello from qaz and hello from bar and hello from hole');

        try {
            await act('UNKNOWN/qaz');
            return Promise.reject(new Error('Should fail'));
        }
        catch (err) {
            expect(err.message).toMatch(/Cannot find action "UNKNOWN\/qaz"/);
        }
    });
});
