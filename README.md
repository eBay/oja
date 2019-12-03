<p align="center">
    <img src="https://github.com/trooba/branding/raw/master/images/oja.png" alt="Oja logo" width="200" /> <span style="font-size: 2em;">v2.0</span><br /><br />
</p>

Lightweight dependency injection framework to structure application business logic.

[![Lerna](https://img.shields.io/badge/monorepo-lerna-531099.svg)](https://github.com/lerna/lerna)
[![License](https://img.shields.io/github/license/ebay/oja.svg)](./LICENSE)
[![codecov](https://codecov.io/gh/eBay/oja/branch/master/graph/badge.svg)](https://codecov.io/gh/eBay/oja)
[![Build Status](https://travis-ci.org/eBay/oja.svg?branch=master)](https://travis-ci.org/eBay/oja) [![NPM](https://img.shields.io/npm/v/oja.svg)](https://www.npmjs.com/package/oja)
[![Downloads](https://img.shields.io/npm/dm/oja.svg)](http://npm-stat.com/charts.html?package=oja)
[![Known Vulnerabilities](https://snyk.io/test/github/eBay/oja/badge.svg)](https://snyk.io/test/github/eBay/oja)
[![Greenkeeper badge](https://badges.greenkeeper.io/eBay/oja.svg)](https://greenkeeper.io/)

## Documentation and Packages

Each package is documented in a separate readme:

- [oja-action](https://github.corp.ebay.com/dsemenov/oja/blob/master/packages/oja-action/README.md) -
  Provides action discovery for oja actions based on dependency injection.
- [oja-context](https://github.corp.ebay.com/dsemenov/oja/blob/master/packages/oja-context/README.md) -
  Provides dependency injection.
- [oja-generators](https://github.corp.ebay.com/dsemenov/oja/blob/master/packages/hygen-oja-generators/README.md) -
  Provides code and unit test generation for oja-action framework.
- [oja-flow](https://github.corp.ebay.com/dsemenov/oja/blob/master/packages/oja-flow/README.md) -
  Provides a flow components based on pub/sub pattern with event backlog. This is former oja 1.0 implementation.
- [oja-tools](https://github.corp.ebay.com/dsemenov/oja/blob/master/packages/oja-tools/README.md) -
  Builds on oja-action to provide tools compose actions into higher level actions and/or instrument them via pipe pattern.
- [examples](https://github.corp.ebay.com/dsemenov/oja/blob/master/packages/examples/README.md) -
  Example project demonstrating the use of dependency injection based on oja-action
- [vscode-oja](https://github.corp.ebay.com/dsemenov/oja/blob/master/packages/vscode-oja/README.md) -
  VS Code extension that makes use of oja-action dependency injection layer easy with automatic suggestions and action discovery.
- [oja-linter](https://github.corp.ebay.com/dsemenov/oja/blob/master/packages/oja-linter/README.md) -
  Oja linter for oja-action dependency injection layer that validates your project and discovers any unreachable actions (deleted/modified) at the point of the use of the action.  
- TBD: [oja-workers](https://github.corp.ebay.com/dsemenov/oja/blob/master/packages/oja-workers/README.md) -
  Provides actions pool that can be used to separate actions or group of actions into their own isolated execution environments based on Node v12 lightweight workers.
- TBD: [oja-cloud](https://github.corp.ebay.com/dsemenov/oja/blob/master/packages/oja-cloud/README.md) -
  Provides an adaptor layer to organize and deploy actions to distributed environments aka lambda/serverless.

## Code of Conduct

This project adheres to the [eBay Code of Conduct](./.github/CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

# Author(s)
Dmytro Semenov

# License
Copyright (c) 2019 eBay Inc.

Released under the MIT License http://www.opensource.org/licenses/MIT
