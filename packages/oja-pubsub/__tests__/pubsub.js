'use strict';

const Assert = require('assert');
const { createContext } = require('@ebay/oja-action');
const sleep = time => new Promise(resolve => setTimeout(resolve, time));

describe(__filename, () => {
    test('should create one sub, publish and unsubscribe', async () => {
        const context = await createContext();
        // should dispatch with no subscribers
        await context.action('oja/dispatch', 'testEvent', 'foo');
        // add one subscriber
        const events = [];
        const listener = (eventType, eventData) => {
            events.push({ eventType, eventData });
        };
        await context.action('oja/subscribe', 'testEvent', listener);

        await context.action('oja/dispatch', 'testEvent', 'foo');

        Assert.deepEqual([{
            'eventData': 'foo',
            'eventType': 'testEvent'
        }], events);

        await context.action('oja/dispatch', 'testEvent', 'bar');
        Assert.deepEqual([{
            'eventData': 'foo',
            'eventType': 'testEvent'
        }, {
            'eventData': 'bar',
            'eventType': 'testEvent'
        }], events);

        Assert.equal(true, await context.action('oja/unsubscribe', 'testEvent', listener));
        Assert.equal(false, await context.action('oja/unsubscribe', 'testEvent', listener));

        await context.action('oja/dispatch', 'testEvent', 'qaz');

        Assert.deepEqual([{
            'eventData': 'foo',
            'eventType': 'testEvent'
        }, {
            'eventData': 'bar',
            'eventType': 'testEvent'
        }], events);
    });

    test('should register multiple subs with multiple topics', async () => {
        const context = await createContext();
        // add one subscriber
        const events1 = [];
        const listener1 = (eventType, eventData) => {
            events1.push({ eventType, eventData });
        };
        const events2 = [];
        const listener2 = (eventType, eventData) => {
            events2.push({ eventType, eventData });
        };
        const events3 = [];
        const listener3 = (eventType, eventData) => {
            events3.push({ eventType, eventData });
        };

        const [l1, l2, l3] = await Promise.all([
            context.action('oja/subscribe', 'testEvent', listener1),
            context.action('oja/subscribe', 'testEvent', listener2),
            context.action('oja/subscribe', 'testEvent', listener3)
        ]);
        Assert.equal(l1, listener1);
        Assert.equal(l2, listener2);
        Assert.equal(l3, listener3);

        await context.action('oja/dispatch', 'testEvent', 'foo');

        const expectedEvents = [{
            'eventData': 'foo',
            'eventType': 'testEvent'
        }];

        Assert.deepEqual(expectedEvents, events1);
        Assert.deepEqual(expectedEvents, events2);
        Assert.deepEqual(expectedEvents, events3);

        await context.action('oja/dispatch', 'testEvent', 'bar');

        expectedEvents.push({
            'eventData': 'bar',
            'eventType': 'testEvent'
        });

        Assert.deepEqual(expectedEvents, events1);
        Assert.deepEqual(expectedEvents, events2);
        Assert.deepEqual(expectedEvents, events3);

        Assert.equal(true, await context.action('oja/unsubscribe', 'testEvent', listener1));
        await context.action('oja/dispatch', 'testEvent', 'qaz');
        
        const expectedEvents1 = [...expectedEvents];
        Assert.deepEqual(expectedEvents, events1);

        expectedEvents.push({
            'eventData': 'qaz',
            'eventType': 'testEvent'
        });
        Assert.deepEqual(expectedEvents, events2);
        Assert.deepEqual(expectedEvents, events3);

        context.action('oja/subscribe', 'testEvent2', listener2);
        await context.action('oja/dispatch', 'testEvent2', 'rfv');
        Assert.deepEqual([...expectedEvents, {
            'eventData': 'rfv',
            'eventType': 'testEvent2'
        }], events2);
        Assert.deepEqual(expectedEvents1, events1);
        Assert.deepEqual(expectedEvents, events3);
    });

    test('should not conflict between more than one context', async () => {
        const events1 = [];
        const context1 = await createContext();
        await context1.action('oja/subscribe', 'testEvent', (eventType, eventData) => {
            events1.push({ eventType, eventData });
        });
        await context1.action('oja/dispatch', 'testEvent', 'foo');

        const events2 = [];
        const context2 = await createContext();
        await context2.action('oja/subscribe', 'testEvent', (eventType, eventData) => {
            events2.push({ eventType, eventData });
        });
        await context2.action('oja/dispatch', 'testEvent', 'bar');

        Assert.deepEqual([{
            'eventData': 'foo',
            'eventType': 'testEvent'
        }], events1);
        Assert.deepEqual([{
            'eventData': 'bar',
            'eventType': 'testEvent'
        }], events2);
    });

    test('should trigger reset event', async () => {
        const events = [];
        const context = await createContext();
        await context.action('oja/subscribe', 'oja:reset:event', (eventType, eventData) => {
            events.push('sub1');
        });

        await context.action('oja/subscribe', 'oja:reset:event', (eventType, eventData) => {
            events.push('sub2');
        });

        // trigger reset somewhere in the code
        await context.action('oja/reset');
        Assert.deepEqual([
            'sub1',
            'sub2'
        ], events);
    });

    describe('routing', () => {
        test('should route request, no subscribers', async () => {
            const context = await createContext();

            // trigger routing
            const response = await context.action('oja/route', 'oja:route:event', 'foov', 'barv');
            Assert.deepEqual(Symbol.for('noSubscribers'), response);
        });

        test('should route request, one subscriber', async () => {
            const events = [];
            const context = await createContext();
            await context.action('oja/subscribe', 'oja:route:event', (eventType, foo, bar) => {
                events.push([eventType, foo, bar]);
                return 'ok';
            });

            // trigger routing
            const response = await context.action('oja/route', 'oja:route:event', 'foov', 'barv');
            Assert.deepEqual([['oja:route:event', 'foov', 'barv']], events);
            Assert.equal('ok', response);
        });

        test('should route request, multiple subscribers, round robin', async () => {
            const events1 = [];
            const events2 = [];
            const context = await createContext();
            const l1 = await context.action('oja/subscribe', 'oja:route:event', (eventType, foo, bar) => {
                events1.push([eventType, foo, bar]);
                return 'ok1';
            });
            const l2 = await context.action('oja/subscribe', 'oja:route:event', (eventType, foo, bar) => {
                events2.push([eventType, foo, bar]);
                return 'ok2';
            });

            // trigger routing
            Assert.equal('ok1', await context.action('oja/route', 'oja:route:event', 'foov1', 'barv1'));
            Assert.deepEqual([['oja:route:event', 'foov1', 'barv1']], events1);
            Assert.deepEqual([], events2);

            Assert.equal('ok2', await context.action('oja/route', 'oja:route:event', 'foov2', 'barv2'));
            Assert.deepEqual([['oja:route:event', 'foov2', 'barv2']], events2);

            Assert.equal('ok1', await context.action('oja/route', 'oja:route:event', 'foov3', 'barv3'));
            Assert.deepEqual([['oja:route:event', 'foov1', 'barv1'], ['oja:route:event', 'foov3', 'barv3']], events1);
            Assert.deepEqual([['oja:route:event', 'foov2', 'barv2']], events2);

            const events3 = [];
            // subscribe one more
            const l3 = await context.action('oja/subscribe', 'oja:route:event', (eventType, foo, bar) => {
                events3.push([eventType, foo, bar]);
                return 'ok3';
            });

            Assert.equal('ok1', await context.action('oja/route', 'oja:route:event', 'foov4', 'barv4'));
            Assert.equal('ok2', await context.action('oja/route', 'oja:route:event', 'foov5', 'barv5'));
            Assert.equal('ok3', await context.action('oja/route', 'oja:route:event', 'foov6', 'barv6'));

            Assert.ok(await context.action('oja/unsubscribe', 'oja:route:event', l2));
            Assert.equal(false, await context.action('oja/unsubscribe', 'oja:route:event', l2));
            Assert.equal('ok1', await context.action('oja/route', 'oja:route:event', 'foov7', 'barv7'));
            Assert.equal('ok3', await context.action('oja/route', 'oja:route:event', 'foov8', 'barv8'));

            Assert.ok(await context.action('oja/unsubscribe', 'oja:route:event', l1));
            Assert.equal('ok3', await context.action('oja/route', 'oja:route:event', 'foov9', 'barv9'));
            Assert.equal('ok3', await context.action('oja/route', 'oja:route:event', 'foov10', 'barv10'));

            Assert.ok(await context.action('oja/unsubscribe', 'oja:route:event', l3));
            Assert.equal(Symbol.for('noSubscribers'), await context.action('oja/route', 'oja:route:event', 'foov11', 'barv11'));
        });
    });
});
