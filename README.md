<p align="center">
    <img src="https://raw.githubusercontent.com/eBay/oja/master/packages/vscode-oja/images/oja.png" alt="Oja logo" width="200" /> <span style="font-size: 3em;">v2.0</span><br /><br />
</p>

<h1>Status: Not Yet Published</h1>

Lightweight dependency injection framework to structure application business logic.

[![Lerna](https://img.shields.io/badge/monorepo-lerna-531099.svg)](https://github.com/lerna/lerna)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![codecov](https://codecov.io/gh/eBay/oja/branch/master/graph/badge.svg)](https://codecov.io/gh/eBay/oja)
[![Build Status](https://travis-ci.org/eBay/oja.svg?branch=master)](https://travis-ci.org/eBay/oja) [![NPM](https://img.shields.io/npm/v/oja.svg)](https://www.npmjs.com/package/oja)
[![Downloads](https://img.shields.io/npm/dm/oja.svg)](http://npm-stat.com/charts.html?package=oja)
[![Known Vulnerabilities](https://snyk.io/test/github/eBay/oja/badge.svg)](https://snyk.io/test/github/eBay/oja)
[![Greenkeeper badge](https://badges.greenkeeper.io/eBay/oja.svg)](https://greenkeeper.io/)

## Idea

The context based approach allows a developer to slice the business logic into small, isolated business actions that communicate to each other via context. That encourages developers to use the same action interface across application code, which makes the code more predictable, easy to define/compose, and test with mock data. And yes - it makes it boring.

![context diagram](https://raw.githubusercontent.com/eBay/oja/master/packages/oja-context/docs/images/context.png)

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

## Install

In order to realize all benefits of using oja framework you need to do the following:

* Install the following modules as part of your application

    ```
    npm install @ebay/oja-context @ebay/oja-action --save
    npm install @ebay/oja-linter --save-dev
    ```

* Install VSCode extension as part of your VSCode Editor (TBD)

    Note: VSCode extension uses oja-linter to validate your project files (action.json, *.js/mjs) and it will start working as soon as you install @ebay/oja-linter under your application dependencies.

* Install optional hygen generator

    ```
    npm install hygen hygen-add -G
    hygen-add oja-generators
    ```

* Example

    Feel free to explore [examples](https://github.com/eBay/oja/blob/master/packages/examples/README.md), a fully functional application.

## Documentation and Packages

Each package is documented in a separate readme:

- [oja-action](https://github.com/eBay/oja/blob/master/packages/oja-action/README.md) -
  Provides action discovery for oja actions based on dependency injection.
- [oja-context](https://github.com/eBay/oja/blob/master/packages/oja-context/README.md) -
  Provides dependency injection.
- [oja-generators](https://github.com/eBay/oja/blob/master/packages/hygen-oja-generators/README.md) -
  Provides code and unit test generation for oja-action framework.
- [oja-flow](https://github.com/eBay/oja/blob/master/packages/oja-flow/README.md) -
  Provides a flow components based on pub/sub pattern with event backlog. This is former oja 1.0 implementation.
- [oja-tools](https://github.com/eBay/oja/blob/master/packages/oja-tools/README.md) -
  Builds on oja-action to provide tools composing actions into higher level actions and/or instrument them via pipe pattern.
- [examples](https://github.com/eBay/oja/blob/master/packages/examples/README.md) -
  Example project demonstrating the use of dependency injection based on oja-action
- [vscode-oja](https://github.com/eBay/oja/blob/master/packages/vscode-oja/README.md) -
  VS Code extension that simplifies oja-action dependency injection usage with automatic suggestions and action discovery.
- [oja-linter](https://github.com/eBay/oja/blob/master/packages/oja-linter/README.md) -
  Oja linter for oja-action dependency injection layer that validates your project and discovers any unreachable actions (deleted/modified) at the point of the use of the action.  
- TBD: [oja-pubsub](https://github.com/eBay/oja/blob/master/packages/oja-pubsub/README.md) - Provides a way to organize actions into publishers and subscribers roles when the same business events need to be consumed by multiple consumer actions.
- TBD: [oja-workers](https://github.com/eBay/oja/blob/master/packages/oja-workers/README.md) -
  Provides an action pool that can be used to separate actions or group of actions into their own isolated execution environments based on Node v12 lightweight workers.
- TBD: [oja-cloud](https://github.com/eBay/oja/blob/master/packages/oja-cloud/README.md) -
  Provides an adaptor layer to organize and deploy actions to distributed environments aka lambda/serverless.

## Example Use-Cases

* Extension point

* Middleware

* Feature activation/selection

* Flow selection

* Pub/sub pattern to decouple producer actions from consumer actions

* What if you are "stuck" with express, but like Koa syntax?

## Code of Conduct

This project adheres to the [eBay Code of Conduct](./.github/CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

# Author(s)
Dmytro Semenov

# License
Copyright (c) 2019 eBay Inc.

Released under the MIT License http://www.opensource.org/licenses/MIT
