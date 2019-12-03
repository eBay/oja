'use strict';

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

        test('should add new page with method and security level', () => {
            runCmd(`npm install ../../../../oja-context ../../../../oja-action`);
            runCmd(`hygen oja init`);
            runCmd(`hygen action new FOONS/foo`);
            runCmd(`hygen action new FOONS/bar`);
            runCmd(`hygen action new QAZNS/qaz --target src`);
            runCmd(`hygen action new SERVICES/svc1 --target src/service`);
            runCmd('npm run test:actions');
            runCmd('npm run test:actions:coverage');
        });
    });
});