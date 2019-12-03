# oja-linter

Searches directory tree of js/mjs files for `context.action('action namespace', ...args)` starting from the given or current working folder. If found, it would validate the availability of the action at the point of use.

## Installation

```
$ yarn add @ebay/oja-linter -D
```

## Usage

```bash
$ yarn ojalint <project folder | cwd>
```

### Configuration

#### .ojalitignore file

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
