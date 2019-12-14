'use strict';

const Assert = require('assert');
const Pipe = require('../pipe');

describe(__filename, () => {
    test('should create simple pipe action', async () => {
        const pipe = new Pipe().next(itm => itm).build();

        const action = pipe();
        const ret = await action('foo');
        Assert.equal('foo', ret);

        Assert.equal('bar', await action('bar'));
    });

    test('should create longer pipe action', async () => {
        const pipe = new Pipe()
            .next(data => data)
            .next(data => `-${data}-`);

        const action = pipe.build()();
        const ret = await action('foo');
        Assert.equal('-foo-', ret);
    });

    test('should create pipe with map and reduce', async () => {
        const pipe = new Pipe()
            .next(data => data.split(','))
            .map(data => `-${data}-`)
            .reduce();

        const action = pipe.build()();
        const ret = await action('one,two');
        Assert.deepEqual(['-one-', '-two-'], ret);
    });

    test('should create pipe with map and merge', async () => {
        const pipe = new Pipe()
            .next(data => data.split(','))
            .map(data => {
                const ret = {};
                ret[data] = `-${data}-`;
                return ret;
            })
            .merge();

        const action = pipe.build()();
        const ret = await action('one,two');
        Assert.deepEqual({ one: '-one-', two: '-two-' }, ret);
    });

    test('should catch error and proceed', async () => {
        const pipe = new Pipe()
            .next(data => data.split(','))
            .map((data, index) => {
                if (index > 0) {
                    throw new Error('BOOM');
                }
                const ret = {};
                ret[data] = `-${data}-`;
                return ret;
            })
            .catch(err => ({ 'status': 'error' }))
            .merge();

        const action = pipe.build()();
        const ret = await action('one,two');
        Assert.deepEqual({ one: '-one-', status: 'error' }, ret);
    });

    test('should catch error and proceed further and filter error out', async () => {
        const pipe = new Pipe()
            .next(data => data.split(','))
            .map((data, index) => {
                if (index > 0) {
                    throw new Error('BOOM');
                }
                const ret = {};
                ret[data] = `-${data}-`;
                return ret;
            })
            .catch(err => ({ 'status': 'error' }))
            .merge()
            .next(obj => Object.keys(obj))
            .filter(itm => itm !== 'status')
            .reduce();

        const action = pipe.build()();
        const ret = await action('one,two');
        Assert.deepEqual(['one'], ret);
    });

    test('should catch error and proceed further and get another error', async () => {
        const pipe = new Pipe()
            .next(data => data.split(','))
            .map((data, index) => {
                if (index > 0) {
                    throw new Error('BOOM');
                }
                return `-${data}-`;
            })
            .catch((err, index) => 'boom')
            .next((itm, index) => {
                if (index === 0) {
                    throw new Error('BOOM2');
                }
                return itm;
            })
            .catch(err => 'boom')
            .next(itm => itm)
            .filter(itm => itm !== 'status')
            .reduce();

        const action = pipe.build()();
        const ret = await action('one,two');
        Assert.deepEqual(['boom', 'boom'], ret);
    });

    test('should handle order while error in stream', async () => {
        const pipe = new Pipe()
            .next(data => data.split(','))
            .map((data, index) => `-${data}-`)
            .next((itm, index) => {
                if (index === 1) {
                    throw new Error('BOOM');
                }
                return itm;
            })
            .catch(err => ({ 'status': 'error' }))
            .next((itm, index) => {
                if (index === 0) {
                    throw new Error('BOOM2');
                }
                return itm;
            })
            .catch(err => 'boom')
            .next(itm => itm)
            .filter(itm => itm !== 'status')
            .reduce();

        const action = pipe.build()();
        const ret = await action('one,two');
        Assert.deepEqual(['boom', { status: 'error' }], ret);
    });

    test('should handle order while getting multiple errors', async () => {
        const pipe = new Pipe()
            .next(data => data.split(','))
            .map((data, index) => `-${data}-`)
            .next((itm, index) => {
                if (index === 1 || index === 3) {
                    throw new Error('BOOM');
                }
                return itm;
            })
            .catch(err => 'boom')
            .next((itm, index) => itm)
            .catch(err =>
                'boom' // this will never happen
            )
            .next(itm => itm)
            .filter(itm => itm !== 'status')
            .reduce();

        const action = pipe.build()();
        const ret = await action('one,two,three,four,five');
        Assert.deepEqual(['-one-', 'boom', '-three-', 'boom', '-five-'], ret);
    });

    test('should handle async actions in map', async () => {
        const pipe = new Pipe()
            .next(data => data.split(','))
            .map((data, index) => new Promise(resolve => {
                setTimeout(() => resolve(`-${data}-`), 100 - 10 * index);
            }))
            .next((itm, index) => itm)
            .reduce();

        const action = pipe.build()();
        const ret = await action('one,two,three,four,five');
        Assert.deepEqual(['-five-', '-four-', '-three-', '-two-', '-one-'], ret);
    });

    test('should handle explicit aggregation into array', async () => {
        const pipe = new Pipe()
            .next(data => data.split(','))
            .map((data, index) => new Promise(resolve => {
                setTimeout(() => resolve(`-${data}-`), 100 - 10 * index);
            }))
            .next((itm, index) => itm)
            .reduce((accum, data, index) => {
                accum.push({
                    data, index
                });
                return accum;
            }, [])
            .next(itms => itms
                .sort((a, b) => a.index - b.index)
                .map(itm => itm.data));

        const action = pipe.build()();
        const ret = await action('one,two,three,four,five');
        Assert.deepEqual(['-one-', '-two-', '-three-', '-four-', '-five-'], ret);
    });

    test('should handle explicit aggregation into map', async () => {
        const pipe = new Pipe()
            .next(data => data.split(','))
            .map((data, index) => new Promise(resolve => {
                setTimeout(() => resolve(`-${data}-`), 100 - 10 * index);
            }))
            .next((itm, index) => itm)
            .reduce((accum, data, index) => {
                accum[data] = data;
                return accum;
            }, {});

        const action = pipe.build()();
        const ret = await action('one,two,three,four,five');
        Assert.deepEqual({
            '-five-': '-five-',
            '-four-': '-four-',
            '-three-': '-three-',
            '-two-': '-two-',
            '-one-': '-one-'
        }, ret);
    });

    test('should reject non-array map', async () => {
        const pipe = new Pipe()
            .map((data, index) => data)
            .catch(err => {
                if (err.message === 'map requires array data one') {
                    return 'ok';
                }
            });

        const action = pipe.build()();
        const accum = [];
        for await (const item of action('one')) {
            accum.push(item);
        }
        Assert.equal('ok', accum);
    });

    test('should reject non-array filter', async () => {
        const pipe = new Pipe()
            .filter((data) => data)
            .catch(err => {
                if (err.message === 'filter requires array data one') {
                    return 'ok';
                }
            });

        const action = pipe.build()();
        const accum = [];
        for await (const item of action('one')) {
            accum.push(item);
        }
        Assert.equal('ok', accum);
    });

    test('should reject non-array merge', async () => {
        const pipe = new Pipe()
            .merge((data) => data)
            .catch(err => {
                if (err.message === 'merge requires mapped data') {
                    return 'ok';
                }
            });

        const action = pipe.build()();
        const ret = await action('one');
        Assert.equal('ok', ret);
    });

    test('should return empty when error handler does not return anything', async () => {
        const pipe = new Pipe()
            .merge((data) => data)
            .catch(err => {

            })
            .next(d => d);

        const action = pipe.build()();
        const ret = await action('one');
        Assert.equal(null, ret);
    });

    test('should reject non-array reduce', async () => {
        const pipe = new Pipe()
            .reduce((data) => data)
            .catch(err => {
                if (err.message === 'reduce requires mapped data') {
                    return 'ok';
                }
            });

        const action = pipe.build()();
        const ret = await action('one');
        Assert.equal('ok', ret);
    });

    test('should re-throw in catch', async () => {
        const pipe = new Pipe()
            .reduce((data) => data)
            .catch(err => {
                throw err;
            });

        const action = pipe.build()();
        try {
            await action('one');
            return Promise.reject(new Error('Should not happen'));
        }
        catch (err) {
            Assert.equal('reduce requires mapped data', err.message);
        }
    });

    test('should throw error if no error handler', async () => {
        const pipe = new Pipe()
            .next(() => {
                throw new Error('BOOM');
            });

        const action = pipe.build()();
        try {
            await action('one');
            return Promise.reject(new Error('Should not happen'));
        }
        catch (err) {
            Assert.equal('BOOM', err.message);
        }
    });

    test('should return stream', async () => {
        const pipe = new Pipe()
            .map();

        const action = pipe.build()();
        const ret = await action(['one', 'two']);
        Assert.ok(ret instanceof require('stream').Readable);
    });
});
