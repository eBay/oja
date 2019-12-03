# hygen-oja-generators

The module provides hygen generators for eBay Oja action framework.

Given the fact that all actions have the same style and API, we now can use a simple code generation based on hygen to speed up action creation, including generation of unit tests for the new action using jest test framework.

## Installation

```bash
npm install hygen hygen-add -G
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
