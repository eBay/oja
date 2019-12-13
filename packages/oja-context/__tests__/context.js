'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

const Assert = require('assert');
const createContext = require('ebay@oja-context');

describe(__filename, () => {
    test('should create a simple context', async () => {
        let ctx = createContext();
        ctx.foo = 'foov';
        ctx.bar = 'barv';

        Assert.equal('foov', ctx.foo);
        Assert.equal('barv', ctx.bar);

        ctx = createContext({
            functions: {
                'actions/foo': 'foov',
                'actions/wsx': context => props => 'wsxv'
            }
        });

        Assert.equal('foov', await ctx.action('actions/foo'));
        Assert.equal('wsxv', await ctx.action('actions/wsx'));

        ctx = createContext({
            properties: {
                props: {
                    qaz: 'qazv'
                }
            }
        });
        Assert.equal('qazv', ctx.props.qaz);

        ctx = createContext({
            properties: {
                props: {
                    foo: 'foov'
                }
            },
            functions: {
                'actions/bar': 'barf',
                'actions/qaz': async context => {
                    Assert.ok(context);
                    Assert.equal('barf', await context.action('actions/bar'));
                    Assert.equal('foov', context.props.foo);
                    return () => 'qazf';
                },
                'actions/fail': new Error('BOOM')
            }
        });
        Assert.equal('barf', (await ctx.action('actions/bar')).toString());
        Assert.equal('qazf', await ctx.action('actions/qaz'));
        Assert.equal('barf', await ctx.action('actions/bar'));
        Assert.equal('qazf', await ctx.action('actions/qaz'));
        Assert.equal('barf', await ctx.action('actions/bar'));
        Assert.equal('foov', ctx.props.foo);

        await ctx.action('actions/fail')
            .then(() => {
                throw new Error('Should have failed');
            })
            .catch(err => {
                Assert.equal('BOOM', err.message);
            });
    });

    test('should handle completely async action', async () => {
        const ctx = createContext({
            functions: {
                'actions/foo': context => new Promise(resolve => {
                    // eslint-disable-next-line no-shadow
                    setImmediate(() => resolve(() => new Promise(resolve => {
                        setImmediate(() => resolve('foov'));
                    })));
                })
            }
        });

        Assert.equal('foov', await ctx.action('actions/foo'));
    });

    test('should report action not found', async () => {
        const ctx = createContext();
        await ctx.action('foo')
            .then(() => {
                throw new Error('Should have failed');
            })
            .catch(err => {
                Assert.equal('Cannot find action "foo"', err.message);
            });
    });

    test('should resolve action via resolver', async () => {
        const ctx = createContext({
            resolve: (name, caller) => {
                Assert.deepEqual({ namespace: 'foo' }, name);
                Assert.ok(/oja-context\/__tests__\/context\.js$/.test(caller));
                return () => 'foov';
            }
        });

        Assert.equal('foov', await ctx.action('foo'));
    });

    test('should provide system selectors', async () => {
        const ctx = createContext({
            resolve: (name, caller) => {
                Assert.deepEqual({ namespace: 'foo',
                    selectors: { foo: 'foos', bar: 'bars' }
                }, name);
                Assert.ok(/oja-context\/__tests__\/context\.js$/.test(caller));
                return () => 'foov';
            },
            selectors: {
                foo: 'foos',
                bar: 'bars'
            }
        });

        Assert.equal('foov', await ctx.action('foo'));
    });

    test('should provide system and action selectors', async () => {
        const ctx = createContext({
            resolve: (name, caller) => {
                Assert.deepEqual({ namespace: 'foo',
                    selectors: { foo: 'foos', bar: 'bars', wsx: 'wsxs' }
                }, name);
                Assert.ok(/oja-context\/__tests__\/context\.js$/.test(caller));
                return () => 'foov';
            },
            selectors: {
                foo: 'foos',
                bar: 'bars'
            }
        });

        Assert.equal('foov', await ctx.action({
            name: 'foo',
            wsx: 'wsxs'
        }));
    });

    test('should override system with action selectors', async () => {
        const ctx = createContext({
            resolve: (name, caller) => {
                Assert.deepEqual({ namespace: 'foo',
                    selectors: { foo: 'fooo', bar: 'bars', wsx: 'wsxs' }
                }, name);
                Assert.ok(/oja-context\/__tests__\/context\.js$/.test(caller));
                return () => 'foov';
            },
            selectors: {
                bar: 'bars',
                foo: 'fooo'
            }
        });

        Assert.equal('foov', await ctx.action({
            name: 'foo',
            wsx: 'wsxs'
        }));
    });

    test('should handle only action selectors', async () => {
        const ctx = createContext({
            resolve: (name, caller) => {
                Assert.deepEqual({ namespace: 'foo',
                    selectors: { wsx: 'wsxs' }
                }, name);
                Assert.ok(/oja-context\/__tests__\/context\.js$/.test(caller));
                return () => 'foov';
            }
        });

        Assert.equal('foov', await ctx.action({
            name: 'foo',
            wsx: 'wsxs'
        }));
    });

    test('should handle extended actionc call without selectors', async () => {
        const ctx = createContext({
            resolve: (name, caller) => {
                Assert.deepEqual({ namespace: 'foo' }, name);
                Assert.ok(/oja-context\/__tests__\/context\.js$/.test(caller));
                return () => 'foov';
            }
        });

        Assert.equal('foov', await ctx.action({
            name: 'foo'
        }));
    });

    test('should not resolve action via resolver', async () => {
        const ctx = createContext({
            resolve: () => {}
        });
        await ctx.action('foo')
            .then(() => {
                throw new Error('Should have failed');
            })
            .catch(err => {
                Assert.equal('Cannot find action "foo"', err.message);
            });
    });

    test('should allow properties with their own ref', async () => {
        const domain = {
            foo() {
                return this.bar();
            },
            bar() {
                return 'barv';
            }
        };
        const ctx = createContext({
            properties: {
                domain
            }
        });
        Assert.equal('barv', ctx.domain.bar());
        Assert.equal('barv', ctx.domain.foo());
        Assert.equal('barv', domain.bar());
    });

    test('should allow to form action chains', async () => {
        const ctx = createContext({
            functions: {
                'actions/calc': context => param1 => context.action('actions/mutate', param1),
                'actions/mutate': context => async param1 => {
                    const val = await context.action('actions/three');
                    return param1 + val;
                },
                'actions/three': context => 3
            }
        });

        Assert.equal(5, await await ctx.action('actions/calc', 2));
    });

    test('should allow to form action chains. mock one action', async () => {
        const ctx = createContext({
            functions: {
                'actions/calc': context => param1 => context.action('actions/mutate', param1),
                'actions/mutate': context => async param1 => {
                    const val = await context.action('actions/three');
                    return param1 + val;
                },
                'actions/three': 3
            }
        });

        Assert.equal(5, await await ctx.action('actions/calc', 2));
    });

    test('should define and consume topic in one of the actions', async () => {
        const { Flow } = require('ebay@oja-flow');
        const ctx = createContext(() => new Flow())({
            functions: {
                'actions/calc': context => async () => {
                    const param1 = await context.consume('param1');
                    context.action('actions/mutate', param1);
                    return context.consume('result');
                },
                'actions/mutate': context => async param1 => {
                    const val = await context.action('actions/three');
                    context.define('result', param1 + val);
                },
                'actions/three': context => 3
            }
        });

        ctx.define('param1', 2);
        Assert.equal(5, await await ctx.action('actions/calc'));
    });
});
