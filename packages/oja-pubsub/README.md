# oja-pubsub

[![Downloads](https://img.shields.io/npm/dm/@ebay/oja-pubsub.svg)](http://npm-stat.com/charts.html?package=@ebay/oja-pubsub)

This module is a subset of eBay [Oja](https://github.com/eBay/oja#readme) framework.


The module defines generic actions that can be used to organize actions into publishers and subscribers that are completely disconnected from each others.

__Comparing to [Oja v1.0](https://github.com/eBay/oja/blob/master/packages/oja-flow#readme) this one is pub/sub on steroids - it defines pub/sub pattern using dependency injection.__

## Installation

```
$ npm install @ebay/oja-pubsub --save
```

## Actions

* action(_'oja/subscribe'_, '_topic_', listener) - subscribe to the event.
* action('_oja/unsubscribe_', '_topic_', listener): Promise<boolean> - unsubscribe from the event, returns true if subscriber was found and removed.
* action('_oja/dispatch_', '_topic_', ...args): Promise<[subscriberResponse]> - dispatch event/args to the subscribers.
* action('_oja/route_', '_topic_', ...args): Promise<subscriberResponse> - dispatch event/args to only one subscriber in round robin mode.

## Listener

```js
function (eventType, ...eventData) {}
```

## Usage

* Subscribing to the event:

```js
const { createContext } = require('@ebay/oja-action');
const context = await createContext();
// subscribe
const listener = await context.action('oja/subscribe', 'topic', (eventType, eventData) => {
    console.log(eventData);
});
```

* Dispatching an event:

```js
await context.action('oja/dispatch', 'topic', eventData);
```

* Routing an event to only one subscriber:

```js
const { createContext } = require('@ebay/oja-action');
const context = await createContext();
// subscribe
const listener1 = await context.action('oja/subscribe', 'topic', (eventType, eventData) => {
    console.log('sub1', eventData); // >> one, three
    return 'ok1;
});
const listener2 = await context.action('oja/subscribe', 'topic', (eventType, eventData) => {
    console.log('sub2', eventData); // >> two, four
    return 'ok2'
});
await context.action('oja/route', 'topic', 'one'); // >> ok1
await context.action('oja/route', 'topic', 'two'); // >> ok2
await context.action('oja/route', 'topic', 'three'); // >> ok1
await context.action('oja/route', 'topic', 'four'); // >> ok2
```

* Unsubscribing from the event:

```js
await context.action('oja/unsubscribe', 'topic', listener);
```

### Subscribing as part of other action

```js
context => {
    const listener = context.action(
        'oja/subscribe', 'topic', (eventType, eventData) => {
            console.log(eventData);
        }
    );
}
```

To trigger subscription, one needs to trigger the respective action.

## Oja reset event

In some cases it may be required to reset any cache related to oja.

@ebay/oja-action makes an optional action call 'oja/extension/context/reset' that if extended can be used to reset respective caches. The only problem is it allows a single extenstion while we may need to reset more then one module.
That's where pub/sub pattern comes handy - the module extends reset action and dispatches the event that can be listened by many subscribers.

```js
// this examples requires these modules to be installed: oja-context, oja-action, oja-pubsub
// register reset listeners
await context.action('oja/subscribe', 'oja:reset:event', (eventType, eventData) => {
    console.log('sub1:', eventType); // >>> sub1: oja:reset:event
    console.log(eventData); // >>> undefined, nothing to dispatch yet
});

await context.action('oja/subscribe', 'oja:reset:event', (eventType, eventData) => {
    console.log('sub2:', eventType); // >>> sub2: oja:reset:event
    console.log(eventData); // >>> undefined, nothing to dispatch yet
});

// trigger reset somewhere in the code
await context.action('oja/reset');
```
