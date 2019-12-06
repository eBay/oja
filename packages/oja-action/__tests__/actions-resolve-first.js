/* eslint-disable no-undef */
/* eslint-disable new-cap */
'use strict';

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');
const Shell = require('shelljs');

const {
    resolveFirstAction
} = require('../lib/actions');

describe(__filename, () => {
    describe('resolve', () => {
        const tmpBase = Path.resolve(__dirname, '.tmp-actions');
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

        test('should resolve resolveFirstAction', () => {
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
                version: '1.0.0'
            }, {
                version: '3.0.0',
                module: 'badmod'
            });

            let action = resolveFirstAction('EDCNS/edc', edcMod2);
            Assert.ok(action[
                Symbol.for('oja@action')]
                [Symbol.for('oja@location')]().indexOf(
                    '/app/node_modules/edc/node_modules/qwe/node_modules/edc') !== -1);

            Assert.ok(action[
                Symbol.for('oja@action')]
                [Symbol.for('oja@key')].indexOf(
                    '/app/node_modules/edc/node_modules/qwe/node_modules/edc:.') !== -1);

            action = resolveFirstAction('QAZNS/qaz', appDir);
            Assert.ok(action[
                Symbol.for('oja@action')]
                [Symbol.for('oja@location')]().indexOf(
                    '/app/node_modules/qaz') !== -1);

            action = resolveFirstAction('BARNS/bar', appDir);
            Assert.ok(action[
                Symbol.for('oja@action')]
                [Symbol.for('oja@location')]().indexOf(
                    '/app/modules/bar') !== -1);
        });
    });
});
