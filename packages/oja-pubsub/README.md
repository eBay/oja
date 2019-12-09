# oja-pubsub

[![Downloads](https://img.shields.io/npm/dm/@ebay/oja-pubsub.svg)](http://npm-stat.com/charts.html?package=@ebay/oja-pubsub)

This module is a subset of eBay [Oja](https://github.com/eBay/oja#readme) framework.


The module defines generic actions that can be used to organize actions into publishers and subscribers that are completely disconnected from each others.

## Installation

```
$ npm install @ebay/oja-pubsub --save
```

## Actions

* action(_'oja/subscribe'_, '_topic_', listener) - subscribe to the event
* action('_oja/unsubscribe_', '_topic_', listener) - unsubscribe from the event
* action(_oja/dispatch_, '_topic_', eventData) - dispatch event to the subscribers

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
