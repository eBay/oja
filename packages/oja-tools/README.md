# oja-tools

Defines generic actions that can be used to organize actions into more complex strictures.

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
        "action": "OJA/pipe",
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
const createContextFactory = require('@ebay/oja-action');
const createContext = await createContextFactory();
const context = await createContext();

const result = await context.action('PIPE-EXAMPLE/route');
```
