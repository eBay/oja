# hygen-oja-generators

[![Downloads](https://img.shields.io/npm/dm/hygen-oja-generators.svg)](http://npm-stat.com/charts.html?package=hygen-oja-generators)

The module provides [hygen](https://www.hygen.io/) generators for eBay [Oja](https://github.com/eBay/oja#readme) framework and more specifically for [Action](https://github.com/eBay/oja/blob/master/packages/oja-action#readme) layer.

This module is a subset of .

Given the fact that all actions have the same style and API, we now can use a simple code generation based on [hygen](https://www.hygen.io/) to speed up action creation, including generation of unit tests for the new action using jest test framework.

## Installation

```bash
npm install hygen hygen-add -g
hygen-add oja-generators
```

## Usage

```bash
hygen <command>
# or for help just type
hygen
```

### Steps

### Init oja

```bash
$ hygen oja init
```

### Add action

```bash
$ hygen action new {NAMESPACE}/{NAME} [--target {output dir}]
```
