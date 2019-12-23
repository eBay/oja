'use strict';

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');
const Shell = require('shelljs');

const tmpBase = Path.resolve(__dirname, '.tmp');
const tmpDir = Path.resolve(tmpBase, `${Date.now()}`);

const { runCmd } = require('./fixtures/utils');
const cwd = process.cwd();

describe(__filename, () => {
    describe('empty app', () => {
        beforeEach(() => {
            Shell.rm('-rf', `${tmpBase}`);
            Shell.mkdir('-p', tmpDir);
            Shell.cp('-r', '_templates', `${tmpDir}/_templates`);
            Fs.writeFileSync(`${tmpDir}/package.json`, JSON.stringify({
                name: 'app',
                version: '1.0.0'
            }, null, 2));
            Shell.cd(tmpDir);
        });

        afterEach(() => {
            Shell.cd(cwd);
            Shell.rm('-rf', `${tmpBase}`);
        });

        test('should add a set of actions', () => {
            runCmd(`hygen oja init`);
            runCmd(`hygen action new FOONS/foo`);
            runCmd(`hygen action new FOONS/bar`);
            runCmd(`hygen action new QAZNS/qaz --target src`);
            runCmd(`hygen action new SERVICES/svc1 --target src/service`);
            runCmd(`npm install ../../../../oja-context ../../../../oja-action`);
            runCmd('npm run test:actions');
            runCmd('npm run test:actions:coverage');
        });

        test('should add a set of actions with actions location file being present', () => {
            runCmd(`hygen oja init`);
            runCmd(`hygen action help`);
            runCmd(`hygen action init`);
            runCmd(`hygen action new QAZNS/qaz --target src`);
            runCmd(`hygen action new SERVICES/svc1 --target src/service`);
            runCmd(`npm install ../../../../oja-context ../../../../oja-action`);
            Assert.ok(Fs.existsSync(Path.resolve(tmpDir, 'node_modules/jest')));
            runCmd('npm run test:actions');
            runCmd('npm run test:actions:coverage');
        });

        test('should add mocha and nyc when --mocha options is used', () => {
            runCmd(`hygen oja init`);
            runCmd(`hygen action init`);
            runCmd(`hygen action new QAZNS/qaz --target src --mocha`);
            runCmd(`hygen action new SERVICES/svc1 --target src/service --mocha`);
            runCmd(`npm install ../../../../oja-context ../../../../oja-action`);
            runCmd('npm run test:actions');
            runCmd('npm run test:actions:coverage');
        });

        test('should add a set of actions with actions location file not being present', () => {
            runCmd(`hygen oja init`);
            runCmd(`hygen action new QAZNS/qaz --target src`);
            runCmd(`hygen action new SERVICES/svc1 --target src/service`);
            runCmd(`npm install ../../../../oja-context ../../../../oja-action`);
            runCmd('npm run test:actions');
            runCmd('npm run test:actions:coverage');
        });

        test('should add a set of actions, when scripts in package.json is not empty', () => {
            Fs.writeFileSync(`${tmpDir}/package.json`, JSON.stringify({
                name: 'app',
                version: '1.0.0',
                scripts: {
                    test: 'echo node tests'
                }
            }, null, 2));
            runCmd(`hygen oja init`);
            runCmd(`hygen action new FOONS/foo`);
            runCmd(`hygen action new FOONS/bar`);
            runCmd(`hygen action new QAZNS/qaz --target src`);
            runCmd(`hygen action new SERVICES/svc1 --target src/service`);
            runCmd(`npm install ../../../../oja-context ../../../../oja-action`);
            runCmd('npm run test:actions');
            runCmd('npm run test:actions:coverage');
        });

        test('should fail to add a single action to the root when actions location file is present', () => {
            runCmd(`hygen oja init`);
            runCmd(`hygen action init`);
            Assert.throws(() => {
                runCmd(`hygen action new FOONS/foo`);
            }, /Error: command hygen action new FOONS\/foo failed/);

            runCmd(`hygen action new QAZNS/qaz --target src`);
            runCmd(`hygen action new SERVICES/svc1 --target src/service`);
            runCmd(`npm install ../../../../oja-context ../../../../oja-action`);
            runCmd('npm run test:actions');
            runCmd('npm run test:actions:coverage');
        });
    });
});