# oja-linter

[![Downloads](https://img.shields.io/npm/dm/@ebay/oja-linter.svg)](http://npm-stat.com/charts.html?package=@ebay/oja-linter)

This module is a subset of eBay [Oja](https://github.com/eBay/oja#readme) framework.

The module traverses directory tree starting from the given or the current working folder and searches js/mjs files for `context.action('action namespace', ...args)`. If found, it would validate the availability of the action at the point of use. It also validates action.json files for duplicate actions as well as action handlers existence.

## Installation

```
$ yarn add @ebay/oja-linter -D
```

## Usage

```bash
$ yarn ojalint <project folder | cwd>
```

### Configuration

#### .ojalintignore file

Exclude specific files/folder from the linting process, please use `.ojalitignore` at app root.

.ojalintignore file:

```
node_modules
coverage
```

#### Error/warn masking

To mark any errors or warnings as ok, please use:

`// oja-lint-disable-next-line no-warn` to mark the next line to ignore warnings

`// oja-lint-disable-next-line no-error` to mark the next line as non-error

#### TODO:

* Support group of actions under the same namespace
