'use strict';

const Assert = require('assert');
const { EventEmitter } = require('events');
const { ReadableStream } = require('../lib/streaming');
const done = require('./fixtures/done');

describe('ReadableStream', () => {
    test('should create empty readable stream', next => {
        const emitter = new EventEmitter();
        const stream = new ReadableStream('topic', emitter);
        stream.on('data', () => next(new Error('Should not happen')));
        setImmediate(next);
    });

    test('should create empty readable stream and close it', next => {
        const emitter = new EventEmitter();
        const stream = new ReadableStream('topic', emitter);
        emitter.emit('topic');
        setImmediate(() => {
            stream.on('data', () => next(new Error('Should not happen')));
            stream.on('end', next);
        });
    });

    test('should create empty readable stream and close it after start listening', next => {
        const emitter = new EventEmitter();
        const stream = new ReadableStream('topic', emitter);
        setImmediate(() => {
            stream.on('data', () => next(new Error('Should not happen')));
            stream.on('end', next);
            setImmediate(() => emitter.emit('topic'));
        });
    });

    test('should read from stream', next => {
        const emitter = new EventEmitter();
        const stream = new ReadableStream('topic', emitter);
        const buffer = [];
        emitter.emit('topic', 'one');
        setImmediate(() => {
            stream.on('data', data => buffer.push(data));
            stream.on('end', () => {
                Assert.deepEqual(['one', 'two'], buffer);
                next();
            });
        });

        setImmediate(() => {
            emitter.emit('topic', 'two');
            setImmediate(() => {
                // complete
                emitter.emit('topic');
            });
        });
    });

    test('should close stream and ignore further events', next => {
        const emitter = new EventEmitter();
        const stream = new ReadableStream('topic', emitter);
        const buffer = [];
        const expected = [];
        next = done(2, next);
        // now consume it
        stream.on('data', data => {
            buffer.push(data);
        });
        stream.on('end', () => {
            // Assert.deepEqual([], stream._buffer);
            Assert.deepEqual(expected, buffer);
            Assert.equal(19, buffer.length);
            next();
        });
        // first make it buffer
        for (let i = 1; i < 20; i++) {
            emitter.emit('topic', i);
            expected.push(i);
        }
        // check buffer is not mpety
        Assert.ok(stream._buffer.length > 0);
        setImmediate(() => {
            emitter.emit('topic');
            setImmediate(() => {
                // now generate more events
                for (let i = 1; i < 20; i++) {
                    emitter.emit('topic', i);
                }
                setImmediate(next);
            });
        });
    });

    test('should buffer before consuming starts', next => {
        const emitter = new EventEmitter();
        const stream = new ReadableStream('topic', emitter);
        const buffer = [];
        const expected = [];
        for (let i = 1; i < 20; i++) {
            emitter.emit('topic', i);
            expected.push(i);
        }
        // native stream buffer will consume 16 object entries by default
        // the rest goes to oja stream buffer
        Assert.deepEqual([17, 18, 19], stream._buffer);
        emitter.emit('topic'); // mark the end

        setImmediate(() => {
            stream.on('data', data => {
                buffer.push(data);
            });
            stream.on('end', () => {
                Assert.deepEqual(expected, buffer);
                next();
            });
        });
    });

    test('should not buffer when stream is closed', next => {
        const emitter = new EventEmitter();
        const stream = new ReadableStream('topic', emitter);
        const buffer = [];
        const expected = [];
        let i;
        for (i = 1; i < 20; i++) {
            emitter.emit('topic', i);
            expected.push(i);
        }
        emitter.emit('topic');
        for (; i < 30; i++) {
            emitter.emit('topic', i);
        }

        setImmediate(() => {
            stream.on('data', data => {
                buffer.push(data);
            });
            stream.on('end', () => {
                Assert.deepEqual([], stream._buffer);
                Assert.deepEqual(expected, buffer);
                next();
            });
        });
    });

    test('should stop buffering once it is stopped, explicitly', next => {
        const emitter = new EventEmitter();
        const stream = new ReadableStream('topic', emitter);
        const buffer = [];
        const expected = [];
        let i;
        for (i = 1; i < 5; i++) {
            emitter.emit('topic', i);
            expected.push(i);
        }
        stream.push(null);

        setImmediate(() => {
            stream.on('data', data => {
                buffer.push(data);
            });
            stream.on('end', () => {
                // Assert.deepEqual([], stream._buffer);
                Assert.deepEqual(expected, buffer);
                next();
            });
            for (; i < 10; i++) {
                emitter.emit('topic', i);
            }
        });
    });

    test('should not close the stream when oja buffer becomes empty', next => {
        const emitter = new EventEmitter();
        const stream = new ReadableStream('topic', emitter);
        const buffer = [];
        const expected = [];
        // now consume it
        stream.on('data', data => {
            buffer.push(data);
        });
        stream.on('end', () => {
            // Assert.deepEqual([], stream._buffer);
            Assert.deepEqual(expected, buffer);
            Assert.equal(40, buffer.length);
            next();
        });
        // first make it buffer
        for (let i = 1; i < 20; i++) {
            emitter.emit('topic', i);
            expected.push(i);
        }
        // check buffer is not mpety
        Assert.ok(stream._buffer.length > 0);

        setImmediate(() => {
            // buffer should be empty now
            Assert.equal(0, stream._buffer.length);
            for (let i = 20; i <= 40; i++) {
                emitter.emit('topic', i);
                expected.push(i);
            }
            emitter.emit('topic');
        });
    });

    test('should create filter other topics', next => {
        const emitter = new EventEmitter();
        const stream = new ReadableStream('topic', emitter);
        const buffer = [];
        emitter.emit('topic', 'one');

        emitter.emit('foo', 'bar');
        emitter.emit('foo');
        setImmediate(() => {
            emitter.emit('topic', 'two');
            emitter.emit('topic');
        });
        // now consume it
        stream.on('data', data => {
            buffer.push(data);
        });
        stream.on('end', () => {
            Assert.deepEqual(['one', 'two'], buffer);
            next();
        });
    });

    test('should handle stream error', next => {
        const emitter = new EventEmitter();
        const stream = new ReadableStream('topic', emitter);
        emitter.on('error', err => {
            Assert.equal('Boom', err.message);
            next();
        });
        stream.emit('error', new Error('Boom'));
    });

    test('should close stream when error happens', next => {
        const emitter = new EventEmitter();
        const stream = new ReadableStream('topic', emitter);
        stream.on('data', () => next('Should not happen'));
        emitter.on('error', err => {
            Assert.equal('Boom', err.message);
            emitter.emit('topic', 'one');
            setImmediate(next);
        });
        stream.emit('error', new Error('Boom'));
    });
});
