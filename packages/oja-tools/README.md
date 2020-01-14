# oja-tools

[![Downloads](https://img.shields.io/npm/dm/@ebay/oja-tools.svg)](http://npm-stat.com/charts.html?package=@ebay/oja-tools)

This module is a subset of eBay [Oja](https://github.com/eBay/oja#readme) framework.

The module defines generic actions that can be used to organize actions into more complex strictures.

## Installation

```
$ npm install @ebay/oja-tools --save
```

## Usage

### Pipe action

THe pipe action allows to assemble other actions into a pipelines.

* actions.json

```json
{
    "PIPE-EXAMPLE/route": {
        "function": "@ebay/oja-tools/create-and-call",
        "action": "oja/pipe",
        "arguments": {
            "pipe": [
                "FOONS/foo",
                "BARNS/bar",
                "QAZNS/qaz"
            ]
        }
    }
}
```

* other actions action.json:

```json
{
    "FOONS/foo": "foo",
    "BARNS/bar": "bar",
    "QAZNS/qaz": "qaz"
}
```

* bar/qaz/foo.js:

```js
module.exports = context => async next => {
    const result = await next();
    return [...result, 'foov'];
}
```

* calling action:

```js
const { createContext } = require('@ebay/oja-action');
const context = await createContext();
const result = await context.action('PIPE-EXAMPLE/route');
```
