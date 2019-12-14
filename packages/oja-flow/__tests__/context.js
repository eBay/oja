'use strict';

const Assert = require('assert');
const EventContext = require('../lib/event-context');
const done = require('./fixtures/done');

describe(__filename, () => {
    describe('EventContext', () => {
        test('should create eventContext', next => {
            const eventContext = new EventContext();
            Assert.ok(!eventContext._deferred);
            const promise = eventContext.get('data');
            Assert.ok(promise instanceof Promise);
            Assert.equal(promise, eventContext.get('data'));
            next();
        });

        test('should emit data event', next => {
            const eventContext = new EventContext();
            eventContext.on('data', data => {
                Assert.equal('ok', data);
                next();
            });
            eventContext.emit('data', 'ok');
        });

        test('should emit data event and cache it', next => {
            const eventContext = new EventContext();
            eventContext.on('data', data => {
                Assert.equal('ok', data);

                // eslint-disable-next-line no-shadow
                eventContext.on('data', data => {
                    Assert.equal('ok', data);

                    next();
                });
            });
            eventContext.emit('data', 'ok');
        });

        test('should emit error event', next => {
            const eventContext = new EventContext();
            eventContext.on('data', data => {
                next(new Error('Should not happen'));
            });
            eventContext.on('error', err => {
                Assert.equal('Boom', err.message);
                next();
            });
            eventContext.emit('error', new Error('Boom'));
        });

        test('should emit error event and cache it', next => {
            const eventContext = new EventContext();
            eventContext.on('data', data => {
                next(new Error('Should not happen'));
            });
            eventContext.on('error', err => {
                Assert.equal('Boom', err.message);
                // eslint-disable-next-line no-shadow
                eventContext.on('error', err => {
                    Assert.equal('Boom', err.message);
                    next();
                });
            });
            eventContext.emit('error', new Error('Boom'));
        });

        test('should resolve promise', next => {
            const eventContext = new EventContext();
            eventContext.get('data').then(data => {
                Assert.equal('ok', data);
                // eslint-disable-next-line no-shadow
                eventContext.get('data').then(data => {
                    Assert.equal('ok', data);
                    next();
                });
            });
            eventContext.emit('data', 'ok');
        });

        test('should resolve promise from cached data', next => {
            const eventContext = new EventContext();
            eventContext.emit('data', 'ok');
            setImmediate(() => {
                eventContext.get('data').then(data => {
                    Assert.equal('ok', data);
                    next();
                });
            });
        });

        test('should reject promise', next => {
            const eventContext = new EventContext();
            eventContext.get('data')
                .then(data => {
                    next(new Error('Should not happen'));
                })
                .catch(err => {
                    Assert.equal('Boom', err.message);
                    next();
                });
            eventContext.emit('error', new Error('Boom'));
        });

        test('should reject promise from cache', next => {
            const eventContext = new EventContext();
            Assert.throws(() => {
                eventContext.emit('error', new Error('Boom'));
            }, /Boom/);

            eventContext.get('data')
                .then(data => {
                    next(new Error('Should not happen'));
                })
                .catch(err => {
                    Assert.equal('Boom', err.message);
                    // eslint-disable-next-line no-shadow
                    eventContext.get('data').catch(err => {
                        Assert.equal('Boom', err.message);
                        next();
                    });
                });
        });

        test('should resolve first event', next => {
            const eventContext = new EventContext();
            eventContext.get('data').then(data => {
                Assert.equal('ok', data);
                next();
            });
            eventContext.emit('data', 'ok');
            eventContext.emit('data', 'ok2');
        });

        test('should resolve first event from cache', next => {
            const eventContext = new EventContext();
            eventContext.emit('data', 'ok');
            eventContext.emit('data', 'ok2');

            eventContext.get('data').then(data => {
                Assert.equal('ok', data);
                next();
            });
        });

        test('should get two events', next => {
            const eventContext = new EventContext();
            let counter = 0;
            eventContext.on('data', data => {
                counter++;
                if (counter === 2) {
                    Assert.equal('ok2', data);
                    next();
                    return;
                }
                Assert.equal('ok', data);
            });
            eventContext.emit('data', 'ok');
            eventContext.emit('data', 'ok2');
        });

        test('should get two events from cache', next => {
            const eventContext = new EventContext();
            let counter = 0;
            eventContext.emit('data', 'ok');

            eventContext.on('data', data => {
                counter++;
                if (counter === 2) {
                    Assert.equal('ok2', data);
                    next();
                    return;
                }
                Assert.equal('ok', data);
            });

            eventContext.emit('data', 'ok2');
        });

        test('should reject first error and ignore the rest', next => {
            const eventContext = new EventContext();

            let promiseErr = 0;
            eventContext.get('data')
                .then(data => {
                    next(new Error('Should not happen'));
                })
                .catch(err => {
                    Assert.equal('Boom', err.message);
                    promiseErr++;
                });

            let errCount = 0;
            eventContext.on('error', err => {
                setImmediate(() => {
                    errCount++;
                    if (errCount === 2) {
                        Assert.equal(1, promiseErr);
                        next();
                    }
                });
            });

            eventContext.emit('error', new Error('Boom'));
            eventContext.emit('error', new Error('Boom'));
        });
    });

    describe('StageContext', () => {
        test('should create stageContext from eventContext', next => {
            const eventContext = new EventContext({
                foo: 'bar',
                asd: 'fgt'
            });
            const stageCtx = eventContext.stageContext();
            Assert.equal('bar', stageCtx.get('foo'));
            Assert.equal('fgt', stageCtx.get('asd'));
            Assert.ok(stageCtx.get('unknown') instanceof Promise);
            next();
        });

        test('should stageContext and publish to default target', next => {
            const eventContext = new EventContext();
            const stageCtx = eventContext.stageContext();
            stageCtx.pub('ok');
            eventContext.get('data').then(data => {
                Assert.equal('ok', data);
                next();
            });
        });

        test('should stageContext and publish to topics', next => {
            const eventContext = new EventContext();
            const stageCtx = eventContext.stageContext('foo', 'bar');
            next = done(2, next);
            eventContext.get('foo').then(data => {
                Assert.equal('ok', data);
                next();
            });
            eventContext.get('bar').then(data => {
                Assert.equal('ok', data);
                next();
            });
            stageCtx.pub('ok');
        });

        test('should stageContext and publish to topics, array', next => {
            const eventContext = new EventContext();
            const stageCtx = eventContext.stageContext(['foo', 'bar']);
            next = done(2, next);
            eventContext.get('foo').then(data => {
                Assert.equal('ok', data);
                next();
            });
            eventContext.get('bar').then(data => {
                Assert.equal('ok', data);
                next();
            });
            stageCtx.pub('ok');
        });

        test('should stageContext and publish to topics, array, multiple publishes', next => {
            const eventContext = new EventContext();
            const stageCtx = eventContext.stageContext(['foo', 'bar']);
            next = done(2, next);
            eventContext.get('foo').then(data => {
                Assert.equal('ok', data);
                next();
            });
            eventContext.get('bar').then(data => {
                Assert.equal('ok', data);
                next();
            });
            stageCtx.pub('ok');
            stageCtx.pub('ok');
        });

        test('should stageContext and publish to topics, multiple publishes', next => {
            const eventContext = new EventContext();
            const stageCtx = eventContext.stageContext(['foo', 'bar']);
            next = done(4, next);
            eventContext.on('foo', data => {
                Assert.equal('ok', data);
                next();
            });
            eventContext.on('bar', data => {
                Assert.equal('ok', data);
                next();
            });
            stageCtx.pub('ok');
            stageCtx.pub('ok');
        });
    });
});
