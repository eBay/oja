'use strict';

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');
const Shell = require('shelljs');

const {
    resolveAllUniqueActions,
    resolveAllActions,
    resolve
} = require('../lib/actions');

describe(__filename, () => {
    const tmpBase = Path.resolve(__dirname, '.tmp-actions-resolve');
    const tmpDir = Path.resolve(tmpBase, `${Date.now()}`);
    const appDir = Path.resolve(tmpDir, 'app');

    function createMockModule(name, dir = appDir, actionJson = {}, pkg = {
        version: '1.0.0',
        main: './index'
    }) {
        const modRoot = Path.resolve(dir, 'node_modules', name);
        Shell.mkdir('-p', modRoot);
        pkg = Object.assign(pkg, { name });
        Fs.writeFileSync(`${modRoot}/package.json`, JSON.stringify(pkg));
        actionJson = {
            [`${name.toUpperCase()}NS/${name}`]: Object.assign(actionJson, {
                'function': '.'
            })
        };
        Fs.writeFileSync(`${modRoot}/action.json`, JSON.stringify(actionJson));
        Fs.writeFileSync(`${modRoot}/index.js`, `module.exports = () => '${name}v';`);
        return modRoot;
    }

    beforeEach(() => {
        Shell.rm('-rf', tmpBase);
        Shell.mkdir('-p', tmpDir);
        Shell.cp('-r', Path.resolve(__dirname, 'fixtures/app'), tmpDir);
        createMockModule('qaz');
        createMockModule('wsx');
        createMockModule('edc');
        createMockModule('rfv');
    });

    afterEach(() => {
        Shell.rm('-rf', tmpBase);
    });

    test('should resolve resolveAllUniqueActions and resolve with selectors', () => {
        const edcMod = createMockModule('edc', appDir, {
            version: '1.0.0',
            env: 'prod'
        }, {
            version: '4.0.0',
            module: 'edcmod'
        });

        const qweMod = createMockModule('qwe', edcMod, {
            version: '1.0.0'
        }, {
            version: '2.0.0',
            module: 'qwemod'
        });

        const edcMod2 = createMockModule('edc', qweMod, {
            env: 'test'
        }, {
            version: '3.0.0',
            module: 'badmod'
        });

        let actions = resolveAllUniqueActions('EDCNS/edc', edcMod2);
        Assert.equal(2, actions.length);
        Assert.equal(2, resolveAllActions('EDCNS/edc', edcMod2).length);

        Assert.ok(actions[0][
            Symbol.for('oja@action')]
            [Symbol.for('oja@location')]().indexOf(
                '/app/node_modules/edc/node_modules/qwe/node_modules/edc') !== -1);

        Assert.ok(actions[1][
            Symbol.for('oja@action')]
            [Symbol.for('oja@location')]().indexOf('/app/node_modules/edc') !== -1);
        // check caching
        const _actions = resolveAllUniqueActions('EDCNS/edc', edcMod2);
        Assert.equal(_actions[0], actions[0]);
        Assert.equal(_actions[1], actions[1]);

        Assert.equal(_actions[0], resolve({ namespace: 'EDCNS/edc', selectors: { version: '3.0.0' } }, edcMod2));
        Assert.equal(_actions[1], resolve({ namespace: 'EDCNS/edc', selectors: { version: '1.0.0' } }, edcMod2));
        Assert.equal(_actions[0], resolve({ namespace: 'EDCNS/edc', selectors: { '~version': '4.0.0' } }, edcMod2));
        Assert.equal(_actions[1], resolve({ namespace: 'EDCNS/edc', selectors: {
            '~env': 'prod',
            '~version': '4.0.0'
        } }, edcMod2));
        Assert.equal(_actions[0], resolve({ namespace: 'EDCNS/edc', selectors: {
            '~version': '4.0.0',
            '~env': 'prod'
        } }, edcMod2));

        actions = resolveAllUniqueActions('QAZNS/qaz', appDir);
        Assert.equal(1, actions.length);
        Assert.ok(actions[0][
            Symbol.for('oja@action')]
            [Symbol.for('oja@location')]().indexOf(
                '/app/node_modules/qaz') !== -1);

        actions = resolveAllActions('QAZNS/qaz', appDir);
        Assert.equal(1, actions.length);

        actions = resolveAllUniqueActions('BARNS/bar', appDir);
        Assert.equal(1, actions.length);
        Assert.ok(actions[0][
            Symbol.for('oja@action')]
            [Symbol.for('oja@location')]().indexOf(
                '/app/modules/bar') !== -1);

        let allActions = resolveAllActions('*', appDir);
        Assert.equal(15, allActions.length);

        allActions = resolveAllActions('*', edcMod2);
        Assert.equal(18, allActions.length);
    });
});
