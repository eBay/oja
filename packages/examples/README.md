# oja-selling-example-context

An example of structuring app business logic using [oja](https://github.com/dimichgh/oja) actions.

This is a demo application that shows how application business logic can be structured into independent, shareable actions that can be tested independently and later used to compose more complex actions/pages/responses.

<p align="center">
    <img src="demo.svg" />
</p>

## Usage

### Install
```bash
cd examples
npm install
```

### Running tests

```bash
npm test
```

### Running app
```bash
node .
```

### Creating new action

#### Install hygen plugin

```bash
npm install hygen -g
npm install hygen-add -g
cd <your app dir>
hygen-add oja-generators
```

```bash
hygen action new <domain>/<actionName>
# example
# hygen action new consumer/buy
```

The output would be
```
Loaded templates: _templates
       added: src/consumer/buy/unit-test/index.spec.js
       added: src/consumer/buy/index.js
```