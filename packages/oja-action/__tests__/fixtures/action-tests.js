/* eslint-disable no-undef */
/* eslint-disable new-cap */
'use strict';

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');
const Shell = require('shelljs');
const Actions = require('../../lib/actions');

const {
    matchAction,
    findAction,
    resolveFirstAction,
    // getRootPackage,
    compareActions,
    annotate,
    loadActions,
    requireAction,
    lazyActionResolve,
    createLazyAction,
    resolve,
    resolveActions,
    moduleRoot,
    getAllDependencyNames
} = Actions;

module.exports = (testName) => {
    test('should match action', () => {
        Assert.ok(matchAction({
            namespace: 'foo'
        }), 'should match with undefined selectors');

        Assert.ok(matchAction({
            namespace: 'foo'
        }, {}), 'should match');

        Assert.ok(matchAction({
            namespace: 'foo',
            [Symbol.for('oja@action')]: {}
        }, {}), 'should match with empty selectors');

        Assert.ok(!matchAction({
            namespace: 'foo',
            [Symbol.for('oja@action')]: {
                version: '1.0.0'
            }
        }, {
            sel: 'selv'
        }), 'should not match non-matching selectors');

        Assert.ok(matchAction({
            namespace: 'foo',
            [Symbol.for('oja@action')]: {
                version: '1.0.0',
                env: 'test'
            }
        }, {
            env: 'test'
        }), 'should match with matching selector');

        Assert.ok(!matchAction({
            namespace: 'foo',
            [Symbol.for('oja@action')]: {
                version: '1.0.0',
                env: 'test'
            }
        }, {
            env: true
        }), 'should not match with matching selector');

        Assert.ok(!matchAction({
            namespace: 'foo',
            [Symbol.for('oja@action')]: {
                version: '1.0.0',
                env: 'test'
            }
        }, {
            env: false
        }), 'should not match with matching selector');

        Assert.ok(matchAction({
            namespace: 'foo',
            [Symbol.for('oja@action')]: {
                version: '1.0.0',
                env: 'test'
            }
        }, {
            '~env': 'test'
        }), 'should match with matching selector marked as fallback');

        Assert.ok(matchAction({
            namespace: 'foo',
            [Symbol.for('oja@action')]: {
                version: '1.0.0',
                env: 'test'
            }
        }, {
            env: /^test$/
        }), 'should match with matching regexp selector');

        Assert.ok(matchAction({
            namespace: 'foo',
            [Symbol.for('oja@action')]: {
                version: '1.0.0',
                env: 'some'
            }
        }, {
            env: () => true
        }), 'should match with matching functional selector');

        Assert.ok(!matchAction({
            namespace: 'foo',
            [Symbol.for('oja@action')]: {
                version: '1.0.0',
                env: 'some'
            }
        }, {
            env: () => false
        }), 'should not match with non-matching functional selector');

        Assert.ok(matchAction({
            namespace: 'foo',
            [Symbol.for('oja@action')]: {
                name: 'fooname',
                version: '1.0.0',
                env: 'some',
                bar: 'barv'
            }
        }, {
            name: 'fooname',
            '~env': () => true,
            '~bar': /^bar/
        }), 'should match with more selectors');

        Assert.ok(!matchAction({
            namespace: 'foo',
            [Symbol.for('oja@action')]: {
                name: 'fooname',
                version: '1.0.0',
                env: 'some',
                bar: 'barv'
            }
        }, {
            name: 'fooname',
            '~env': () => true,
            '~bar': /^ert/
        }), 'should not match with more selectors');

        Assert.ok(!matchAction({
            namespace: 'foo',
            [Symbol.for('oja@action')]: {
                name: 'fooname',
                version: '1.0.0',
                env: 'other',
                bar: 'barv'
            }
        }, {
            env: 'other',
            '~bar': false
        }), 'should not match with drop of fallback');
    });

    test('annotate', () => {
        Assert.deepEqual({
            foo: 'foov',
            [Symbol.for('action')]: {}
        }, annotate({ foo: 'foov' }));

        Assert.deepEqual({
            foo: 'foov',
            [Symbol.for('action')]: {
                bar: 'barv',
                qaz: 'qazv'
            }
        }, annotate({ foo: 'foov' }, { bar: 'barv', qaz: 'qazv' }));

        Assert.deepEqual({
            foo: 'foov',
            [Symbol.for('action')]: {
                bar: 'barv',
                qaz: 'qazv',
                qwe: 'qwev'
            }
        }, annotate({ foo: 'foov' }, { bar: 'barv', qaz: 'qazv' }, { qwe: 'qwev' }));
    });

    test('should findAction', () => {
        function assertAction(expected, actions, selectors) {
            const action = findAction(actions, selectors);
            Assert.equal(expected, action);
        }

        Assert.equal(undefined, findAction([], {}));

        const action = {
            namespace: 'foo',
            [Symbol.for('oja@action')]: {
                name: 'fooname',
                version: '1.0.0',
                env: 'some'
            }
        };

        assertAction(action, [action], {});
        assertAction(action, [action], {
            env: () => true
        });
        assertAction(undefined, [action], {
            env: () => false
        });

        const actionA = {
            namespace: 'foo',
            [Symbol.for('oja@action')]: {
                name: 'barname',
                version: '1.0.0',
                env: 'other',
                bar: 'barv'
            }
        };
        assertAction(action, [actionA, action], {
            env: 'some'
        });
        assertAction(action, [action, actionA], {
            env: 'some'
        });
        assertAction(action, [action, actionA, action], {
            env: 'some'
        });
        assertAction(actionA, [action, actionA, action], {
            env: 'other'
        });
        assertAction(actionA, [action, actionA, action], {
            env: 'other',
            '~bar': false
        });
        assertAction(undefined, [action, actionA, action], {
            env: 'other',
            'bar': false
        });
        assertAction(actionA, [action, actionA, action], {
            '~name': 'noon',
            env: 'other',
            '~bar': false
        });
        assertAction(actionA, [action, actionA, action], {
            '~name': 'barname',
            '~env': 'one',
            '~bar': false
        });
    });

    test('should find root folder of the module', () => {
        Assert.equal(Path.resolve(__dirname, 'app/modules/foo'),
            moduleRoot(require.resolve('./app/modules/foo/lib/index')));
        Assert.equal(Path.resolve(__dirname, 'app/modules/foo'),
            moduleRoot(require.resolve('./app/modules/foo/lib/index')));
        Assert.equal(process.cwd(), moduleRoot('/'));
    });

    test('should find root folder of the app', () => {
        Assert.equal(Path.resolve(__dirname, 'app'),
            moduleRoot(Path.resolve(__dirname, 'app/modules'), true));
    });

    test('should get all modules dependencies', () => {
        Assert.deepEqual(['qaz', '@ebay/oja-action', 'edc', 'rfv', 'wsx'],
            getAllDependencyNames(Path.resolve(__dirname, 'app')));
    });

    test('should requireAction', () => {
        requireAction(require.resolve('./app/modules/foo/lib'));

        Assert.throws(() => {
            requireAction('none');
        }, /Failed to load action none/);
    });

    test('should lazyActionResolve', () => {
        // load relative action
        Assert.equal(require.resolve('./app/modules/foo/lib'),
            lazyActionResolve('foo/lib', Path.resolve(__dirname,
                './app/modules'))());

        // load external action
        Assert.equal(require.resolve('./app/modules/foo/lib'),
            lazyActionResolve(require.resolve('./app/modules/foo/lib'), 'parent-none')());

        Assert.throws(() => {
            lazyActionResolve('none')();
        }, /Cannot locate action at none/);

        Assert.throws(() => {
            lazyActionResolve('none', 'parent-none')();
        }, /Cannot locate action at.+parent-none\/none/);
    });

    test('should create lazy action', () => {
        const path = require.resolve('./app/modules/foo/lib');
        const act = createLazyAction(lazyActionResolve(path));
        Assert.equal('foov', act());
        Assert.equal(path, act[Symbol.for('oja@action')][Symbol.for('oja@location')]());
    });

    test('should loadActions', () => {
        const actions = loadActions(Path.resolve(__dirname, 'app'));
        Assert.deepEqual([
            'DEEP/qwe',
            'EXTERNAL/action',
            'BARNS/bar',
            'BARNS/rab',
            'NESTNS/nest',
            'FOONS/foo'
        ], Object.keys(actions));

        Assert.equal('hello from external action', actions['EXTERNAL/action']());
        Assert.equal('foov', actions['FOONS/foo']());
        Assert.equal('nestv', actions['NESTNS/nest']());
        Assert.equal('barv', actions['BARNS/bar']());
        Assert.equal('rabv', actions['BARNS/rab']());
        Assert.equal('qwev', actions['DEEP/qwe']());

        // check annotations
        const act = actions['FOONS/foo'];
        expect(act[Symbol.for('oja@action')][Symbol.for('oja@location')]())
            .toMatch(/fixtures\/app\/modules\/foo\/lib\/index/);
        expect(act[Symbol.for('oja@action')].namespace)
            .toEqual('FOONS/foo');
        expect(act[Symbol.for('oja@action')].version)
            .toEqual('1.0.0');

        const actBar = actions['BARNS/bar'];
        expect(actBar[Symbol.for('oja@action')][Symbol.for('oja@location')]())
            .toMatch(/fixtures\/app\/modules\/bar\/index/);
        expect(actBar[Symbol.for('oja@action')].namespace)
            .toEqual('BARNS/bar');
        expect(actBar[Symbol.for('oja@action')].version)
            .toEqual('2.0.0');

        const actRab = actions['BARNS/rab'];
        expect(actRab[Symbol.for('oja@action')][Symbol.for('oja@location')]())
            .toMatch(/fixtures\/app\/modules\/bar\/rab/);
        expect(actRab[Symbol.for('oja@action')].namespace)
            .toEqual('BARNS/rab');
        expect(actRab[Symbol.for('oja@action')].version)
            .toEqual('2.0.0');
    });

    describe('compareActions', () => {
        it('should compare actions', () => {
            Assert.ok(compareActions({ namespace: 'foo' }, { namespace: 'foo' }));
            Assert.ok(compareActions({
                [Symbol.for('oja@action')]: {
                    env: 'foo'
                }
            }, {
                [Symbol.for('oja@action')]: {
                    env: 'foo'
                }
            }));
            Assert.ok(!compareActions({
                [Symbol.for('oja@action')]: {
                    env: 'foo'
                }
            }, {
                [Symbol.for('oja@action')]: {
                    env: 'bar'
                }
            }));
            Assert.ok(compareActions({
                [Symbol.for('oja@action')]: {
                    env: 'foo',
                    [Symbol.for('sym')]: 'one'
                }
            }, {
                [Symbol.for('oja@action')]: {
                    env: 'foo',
                    [Symbol.for('sym')]: 'two'
                }
            }), 'should ingore symbold when comparing');
        });
    });

    describe('resolve', () => {
        let tmpBase;
        let tmpDir;
        let appDir;

        beforeAll(() => {
            tmpBase = Path.resolve(__dirname, `.tmp-${testName}`);
            tmpDir = Path.resolve(tmpBase, `${Date.now()}`);
            appDir = Path.resolve(tmpDir, 'app');    
        });

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
            Shell.cp('-r', Path.resolve(__dirname, 'app'), tmpDir);
            createMockModule('qaz');
            createMockModule('wsx');
            createMockModule('edc');
            createMockModule('rfv');  
        });

        afterEach(() => {
            Shell.rm('-rf', tmpBase);
        });

        test('should resolve all actions', () => {
            const root = moduleRoot(
                Path.resolve(appDir, 'modules/bar'));
            const actions = resolveActions(root);
            Assert.equal('foov', actions['FOONS/foo']());
            Assert.equal('qwev', actions['DEEP/qwe']());
            Assert.equal('barv', actions['BARNS/bar']());
            Assert.equal('rabv', actions['BARNS/rab']());
            Assert.equal('qazv', actions['QAZNS/qaz']());
            Assert.equal('wsxv', actions['WSXNS/wsx']());
            Assert.equal('edcv', actions['EDCNS/edc']());
            Assert.equal('rfvv', actions['RFVNS/rfv']());
            Assert.deepEqual([
                'DEEP/qwe',
                'EXTERNAL/action',
                'BARNS/bar',
                'BARNS/rab',
                'NESTNS/nest',
                'FOONS/foo',
                'QAZNS/qaz',
                'oja/extension',
                'oja/resolveAllActions',
                'oja/resolveAllUniqueActions',
                'oja/resolveFirstAction',
                'oja/reset',
                'oja/action',
                'EDCNS/edc',
                'RFVNS/rfv',
                'WSXNS/wsx'
            ], Object.keys(Actions.cache[root]));
            const cache = Actions.cache[moduleRoot(Path.resolve(root, '..'))];
            Assert.deepEqual([
                'oja/extension',
                'oja/resolveAllActions',
                'oja/resolveAllUniqueActions',
                'oja/resolveFirstAction',
                'oja/reset',
                'oja/action'
            ], cache && Object.keys(cache), `Actual: ${JSON.stringify(Actions.cache)}`);
            Assert.equal(16, Object.keys(actions).length);

            // now we can try other root
            const otherActions = resolveActions(moduleRoot(
                Path.resolve(appDir, 'modules/foo/index')));
            Assert.equal(16, Object.keys(otherActions).length,
                'should use the same root cache');
            Assert.equal('foov', otherActions['FOONS/foo']());
            Assert.deepEqual(['FOONS/foo'],
                Object.keys(Actions.cache[Path.resolve(appDir, 'modules/foo')]),
                'should cache per package root');

            const action = resolve({ namespace: 'RFVNS/rfv' },
                moduleRoot(Path.resolve(appDir, 'modules/bar')));
            Assert.equal('rfvv', action());
            Assert.equal(actions['RFVNS/rfv'], action);

            Assert.equal(undefined, resolve('NONE/rfv',
                moduleRoot(Path.resolve(appDir, 'modules/bar'))));
        });

        test('should resolve resolveFirstAction', () => {
            const action = resolveFirstAction('EDCNS/edc', appDir);
            Assert.ok(action[
                Symbol.for('oja@action')]
                [Symbol.for('oja@location')]().indexOf(
                    '/app/node_modules/edc') !== -1);
        });
    });
};