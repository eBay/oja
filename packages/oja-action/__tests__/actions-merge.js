/* eslint-disable no-undef */
/* eslint-disable new-cap */
'use strict';

const Assert = require('assert');
const { mergeActions } = require('../lib/actions');

describe(__filename, () => {
    test('should merge actions', () => {
        const meta = {
            namespace: 'foo',
            [Symbol.for('oja@action')]: {
                version: '1.0.0',
                env: 'test',
                [Symbol.for('oja@location')]: () => 'path/to/foo',
                [Symbol.for('oja@key')]: 'path/to/foo'
            }
        };
        let actions = mergeActions({}, {
            foo: meta
        });
        Assert.equal(meta, actions.foo);

        actions = mergeActions(actions, {
            bar: {
                namespace: 'bar',
                [Symbol.for('oja@action')]: {
                    version: '1.0.0',
                    env: 'test',
                    [Symbol.for('oja@location')]: () => 'path/to/bar',
                    [Symbol.for('oja@key')]: 'path/to/bar'
                }
            }
        });
        Assert.ok(actions.bar);

        const foo2 = {
            namespace: 'foo',
            [Symbol.for('oja@action')]: {
                version: '2.0.0',
                env: 'test',
                [Symbol.for('oja@location')]: () => 'path/to/foo2',
                [Symbol.for('oja@key')]: 'path/to/foo2'
            }
        };

        actions = mergeActions(actions, {
            foo: foo2
        });
        Assert.ok(Array.isArray(actions.foo));
        Assert.equal(2, actions.foo.length);

        actions = mergeActions({}, actions, {
            foo: foo2
        });
        Assert.ok(Array.isArray(actions.foo));
        Assert.equal(2, actions.foo.length);

        // when I merge a group of actions, it should merge only different ones
        actions = mergeActions(actions, {
            foo: [
                foo2,
                {
                    namespace: 'foo',
                    [Symbol.for('oja@action')]: {
                        version: '3.0.0',
                        env: 'test',
                        [Symbol.for('oja@location')]: () => 'path/to/foo3',
                        [Symbol.for('oja@key')]: 'path/to/foo3'
                    }
                }
            ]
        });
        Assert.ok(Array.isArray(actions.foo));

        Assert.equal(3, actions.foo.length);
        Assert.equal('1.0.0', actions.foo[0][Symbol.for('oja@action')].version);
        Assert.equal('2.0.0', actions.foo[1][Symbol.for('oja@action')].version);
        Assert.equal('3.0.0', actions.foo[2][Symbol.for('oja@action')].version);
    });
});
