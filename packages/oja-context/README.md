# oja-context

[![Downloads](https://img.shields.io/npm/dm/oja-context.svg)](http://npm-stat.com/charts.html?package=oja-context)

Defines a basic Oja dependency injection API.

This module is a subset of eBay [Oja](https://github.com/eBay/oja#readme) framework.

## Idea

The dependency injection approach allows the developer to slice the business logic into small, isolated business actions that are injected via context. 

That encourages developers to use the same action interface across application code and makes the code more predictable, easy to define, and test with mock data. And yes - it makes it boring.

### Dependency injection diagram

![context diagram](https://raw.githubusercontent.com/eBay/oja/master/packages/oja-context/docs/images/context.png)

## Install

```
npm install @ebay/oja-context --save
```

## API

The context based approach provides a more explicit way of composing actions in the application while in [publisher/subscriber](https://github.com/eBay/oja/blob/master/packages/oja-pubsub#readme) pattern the consumers of the events are completely disconnected from the publishers.

#### `ojaContext(createBaseContext: Function): Function`

Create a factory function, that if called, will return a context object extended from an object returned by createBaseContext.

#### `ojaContext(options: Map): Function`

Create a context with actions and properties injected as part of options. It returns a context reference which provides access to all other actions. It can also extend a Flow class if requested, so that one can mix flow with context API.

##### Options:

```
{
    functions: Map <
            namespace: String,
            Map <actoinName: String, action: Function>
        >,

    properties: <Map <string, value:Any> >,

    resolve: Function,

    selectors: Map <string, value:Any>
}
```

Where:

* functions: allows to inject action implementation upon the context creation, it is useful for unit testing
* properties: allows to inject any parameter upon the context creation
* resolve: allows to inject custom resolution logic for action discovery, and this is a primary way to inject actions.
* selectors: is a set of key:value pairs that allows to enforce specific selectors for all actions in the given context; the selectors can be dropped if they are prefixed with '~' trying to find a match.

### Calling action

```js
const result = await context.action('action-name-space', arg1, arg2, ...);
```

Or more specific in some rare case with the help of selectors

```js
const result = await context.action({
    name: 'action-name-space',
    'selector1': 'foo', // this selector will not be dropped
    '~selector2': /^bar/, // <<< you can use regexp, and this selector can be dropped
    '~selector3': (value) => true, // <<< or match function, and this selector can be dropped
    ...
}, arg1, arg2, ...);
```

It will make the most relevant match. If no exact match found for the selectors, it will drop selectors prefixed with '~' one by one trying to match the rest starting from the last and moving up while removing. This provide a fallback logic.

## Usage

### Context creation

These are the main properties used for context creation:

* properties are translated into `context.<property name>` access pattern
* functions are translated into `context.<namespace>.<action:function> access pattern
* resolve allows to inject resolution of the actions

```js
const createContext = require('@ebay/oja-context');

// inject/configure context
const context = createContext({
    // injecting properteis
    properties: {
        parameters: {
            foo: 'foov',
            bar: 'barv'
        }
    },
    // injecting actions
    functions: {
        'domainName1/actionName1': context => {},
        'domainName1/actionName2': context => {},
        'domainName2/actionName3': context => {},
        'domainName2/actionName4': context => {}
    }
});

// use it
console.log(context.foo); // >> foov
console.log(context.bar); // >> barv

// call action
const actionResult1 = await context.action('domainName1/actionName1');
const actionResult3 = await context.action('domainName2/actionName3', 'foo', 'bar);
```

Context can extend any base object, for example, you can extend Flow class, and use a pub/sub with context based approach.

```js

const createContextFactory = require('@ebay/oja-context');
const Flow = require('@ebay/oja-pipe').Flow;
const createContext = createContextFactory(() => new Flow());

// inject/configure context
const context = createContext({
    ...
});

modules.exports = async context => {
    const searchResults = await context.action('actions/search', 'foo'); // passing some parameters
    // publish it
    context.define('searchResults', searchResults);
};
// consume it in some other action
modules.exports = async context => {
    const searchResults = await context.consume('searchResults');
    return {
        searchResults
    };
};
```

## General advice

When you migrate your application to oja dependency injection and to make sure you enjoy using it, your code MUST avoid:

* Use any callback style. If you have callback function, wrap it into promise right away.
* Use promise `then` or `catch`. Outlaw them! Always use async/await style.
* Use of event emitters. They should be wrapped into streams of events or promise for catching a single event.
