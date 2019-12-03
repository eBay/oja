# oja-action

Defines a standard oja action component API and provides an action discovery mechanism based on action.json file.

## Installation

```
$ npm install @ebay/oja-action --save
```

## Usage

### Defining an action

* folder structure:

```
  module-root/
    action.json
    action.js
```

* action.json:

```JSON
{
    "MATH/sum": "./action"
}
```

* action.js

```js
module.exports = context => (a, b) => a + b;
```

### Calling action

```js
const { createContext } = require('@ebay/oja-action');
// context creation can be called for every new flow
const context = await createContext();
// calling action can be done many times within the same context
console.log(await context.action('MATH/sum', 1, 2)); // >> 3
console.log(await context.action('MATH/sum', 5, 2)); // >> 7
```

#### Action execution logic

MATH/inc example:
```js
// action.js
module.exports = context => {
    // init state per context if needed
    let count = 0;
    console.log('createContext has been called');
    return () => {
        // action main logic
        return count++;
    }
};

// execution.js
const context = await createContext(); // >> createContext has been called
console.log(await context.action('MATH/inc')); // >> 0
console.log(await context.action('MATH/inc')); // >> 1
console.log(await context.action('MATH/inc')); // >> 2
```

## Defining action component

* The action component may define more than one action.

* The actions can be declared in action.json file as follows:

```JSON
{
    "NAMESPACE1/ACTION-NAME1": "path:src/action1",
    "NAMESPACE1/ACTION-NAME2": "path:src/action2",
    ...
    "NAMESPACE2": {
        "ACTION-NAME3": "path:path/to/actions3",
        "ACTION-NAME4": "path:path/to/actions4"
    }
}
```

* The action.json must be placed into the action folder or into the root for the module or application to let the framework to discover the actions.

* The action packaged into the external modules should be declared in the direct dependencies in the caller application/module package.json.

* The action.json in the root folder may have locations where to search for the actions using relative resolution:

```JSON
[
    "src/actions",
    "src/controllers"
]
```

The above is useful to tell Oja framework where to look for the actions in the application.

Here's more variations of action.json file:

* action with selectors:

```JSON
{
    "MATH/sum": {
        "function": "./action",
        "version": "1.0.0",
        "env": "test"
    }
}
```

* group of actions:

```JSON
{
    "MATH": {
        "sum": "./action-sum",
        "mul": "./action-mul"
    }
}
```

* group of actions with selectors:

```JSON
{
    "MATH": {
        "sum": {
            "function": "./action-sum",
            "env": "test"
        },
        "mul": {
            "function": "./action-mul",
            "env": "test"
        }
    }
}
```

The action can be called as follows:

```js
context.action('NAMESPACE/foo')
```

## Action discovery mechanism

The discovery of actions accessible for the caller starts from the calling point of the specific action. The caller location is used as a starting point to find the root of the module or an application and then use their dependencies as well as action.json at the root, if any, to find available actions.

In case multiple actions define the same namespace/function, the earlier discovered actions will be the first in line for matching. A warning will be produced to notify the developer about the possible conflict when two exact actions are found.

## Action selectors

The matching mechanism allows the use of selectors that help the action resolver pick a more specific action.

The framework by default attaches the following selectors to every action function:

* module is a module or app name where the action was found
* version is a module or app version where the action was found
* namespace is a namespace of the action

One example where defining duplicate actions can be useful is unit tests. The developers can create mock actions with "env": "test" selector, for example, and then use `test` selectors during context creation in the unit tests.

### Example

* <app>/actions/foo/action.json (real):

```json
{
    "NAMESPACE/foo": {
        "function": "index",
        "env": "production"
    }
}
```

* <app>/mocks/foo/actions.json:

```json
{
    "NAMESPACE/foo": {
        "function": "mock-index",
        "env": "test"
    }
}
```

* creating context in production:

```js
// enforcing common selectors for all actions
// during context creation
const context  = createContext({
    selectors: {
        //  note: using '~' allows to drop selector
        // v---- when matching action is not found
        '~env': 'production'
    }
});
```

* creating context during tests:

```js
// enforcing common selectors for all actions
// during context creation
const context  = createContext({
    selectors: {
        //  note: using '~' allows to drop selector
        // v---- when matching action is not found
        '~env': 'test'
    }
});
```

* calling action:

```js
// this will try to find action with env:test attribute
// and if not found, it will drop env selector and dot the search again
context.action('NAMESPACE/foo');
// or you can enforce some selectors per action call
context.action({
    name: 'NAMESPACE/foo',
    foo: 'foov', // << find only actions that have foo=foov
    '~bar': 'barv' // << if not found, drop this selector.
});
```

Note: In some cases developers might skip creating mock versions for some actions but still be able to use a specific selectors for those actions that have the mock versions. In this case the developer can use `~` prefix for the selectors that can be dropped during action resolution when the exact match is not found.

The droppable selectors while matching will be dropped one by one starting from the end, i.e. *the selector order is important*.
