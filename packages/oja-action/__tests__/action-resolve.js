'use strict';

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');
const Shell = require('shelljs');

const createContextCode = () => `
'use strict';

// use relative path from .tmp/app folder
const createContextFactory = require('@ebay/oja-action');
const ojaContext = require('@ebay/oja-context');

module.exports = async (...args) => {
    const createContext = await createContextFactory({
        createContext: ojaContext
    });
    const context = await createContext();
    const components = await context.action(...args);
    return components;
};
`;

describe(__filename, () => {
    // need to avoid loading action json files into require cache
    const tmpBase = Path.resolve(__dirname, '.tmp-action-resolve');
    const tmpDir = Path.resolve(tmpBase, `${Date.now()}`);
    const appDir = Path.resolve(tmpDir, 'app');

    function createMockModule(name, code, selectors, namespace) {
        const modRoot = Path.resolve(appDir, 'node_modules', name);
        Shell.mkdir('-p', modRoot);
        Fs.writeFileSync(`${modRoot}/package.json`, JSON.stringify({
            name,
            version: '1.0.0',
            main: './index'
        }));
        const ns = namespace || `${name.toUpperCase()}NS/${name}`;
        const actionJson = {};
        actionJson[ns] = {
            function: '.',
            ...selectors
        };
        Fs.writeFileSync(`${modRoot}/action.json`, JSON.stringify(actionJson));
        Fs.writeFileSync(`${modRoot}/index.js`, code || `module.exports = () => '${name}v';`);
    }

    // eslint-disable-next-line no-undef
    beforeAll(async () => {
        Shell.rm('-rf', tmpBase);
        Shell.mkdir('-p', tmpDir);

        Shell.cp('-r', Path.resolve(__dirname, 'fixtures/app'), tmpDir);
        Shell.cd(appDir);
        const pkgPath = Path.resolve(appDir, 'package.json');
        // get package content
        const pkg = JSON.parse(Fs.readFileSync(pkgPath).toString());
        // add oja deps
        Object.assign(pkg.dependencies, {
            '@ebay/oja-action': '^2',
            '@ebay/oja-context': '^2'
        });
        Fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
        Fs.writeFileSync(Path.resolve(appDir, 'context.js'), createContextCode(true));

        createMockModule('qaz');
        createMockModule('wsx');
        createMockModule('edc');
        createMockModule('rfv');
        process.env.VS_CODE_OJA_EXTENSION = true;
    });

    // eslint-disable-next-line no-undef
    afterAll(() => {
        Shell.rm('-rf', tmpBase);
    });

    test('should allow to resolve actions via context.action("oja/resolveAllActions")', async () => {
        const actions = await require(Path.resolve(
            tmpDir, 'app/context'))('oja/resolveAllActions', 'QAZNS/qaz', appDir);
        Assert.equal('qazv', await actions[0]());
    });

    test('should allow to resolve actions via context.action("oja/resolve"), namespace: *', async () => {
        const actions = await require(Path.resolve(
            tmpDir, 'app/context'))('oja/resolveAllActions', '*', appDir);
        Assert.equal(16, actions.length);
    });

    test('should resolveActionLocation', async () => {
        const callAction = require(Path.resolve(tmpDir, 'app/context'));
        let location = await callAction('oja/action', 'resolveActionLocation',
            'lib/index', Path.resolve(appDir, 'modules/foo'));
        Assert.equal('/modules/foo/lib/index.js',
            location.substring(appDir.length),
            'should resolve relative action');

        location = await callAction('oja/action', 'resolveActionLocation',
            'qaz', Path.resolve(appDir, 'modules/foo'));
        Assert.equal('/node_modules/qaz/index.js',
            location.substring(appDir.length),
            'should resolve external module action');
    });

    test('should allow to resolve actions via context.action("oja/resolve") with injected actions', async () => {
        createMockModule('rfv',
            `
            module.exports = context => options => {
                return {
                    functions: {
                        'services/foosvc': context.annotate(() => 'foosvcv', { location: 'path/to/config/foo' }),
                        'services/barsvc': context.annotate(() => 'barsvcv', { location: 'path/to/config/bar' })
                    }
                }
            };
            `, {
                'override': true
            },
            'oja/extension/context'
        );

        const callAction = require(Path.resolve(tmpDir, 'app/context'));
        // first reset it after earlier tests
        await callAction('oja/reset');

        const actions = await callAction('oja/resolveAllActions', '*', appDir);

        Assert.equal(18, actions.length);
        Assert.equal('barsvcv', await actions.pop()());
        Assert.equal('foosvcv', await actions.pop()());

        const uactions = await callAction('oja/resolveAllUniqueActions', '*', appDir);
        Assert.equal(18, uactions.length);
        Assert.equal('barsvcv', await uactions.pop()());
        Assert.equal('foosvcv', await uactions.pop()());

        const action = await callAction('oja/resolveFirstAction', 'services/barsvc', appDir);
        Assert.ok(action);

        Assert.equal('barsvcv', await callAction('services/barsvc'));
        Assert.equal('foosvcv', await callAction('services/foosvc'));
    });
});
