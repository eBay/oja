'use strict';

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');

const { parse, findActionFunctions, parseAction } = require('../index');

describe(__filename, () => {
    test('should parse action.json, simple', async () => {
        const content = Fs.readFileSync(Path.resolve(
            __dirname, './fixtures/action-parse/parse-simple/action.json')).toString();
        const stmts = parse(`exports=${content}`);
        Assert.deepEqual(require(
            './fixtures/action-parse/parse-simple/expected.json'), stmts);

        let actions = await findActionFunctions(stmts, 'path/to');
        Assert.deepEqual(require('./fixtures/action-parse/parse-simple/expected-find-actions.json'),
            actions);

        actions = await parseAction(Path.resolve(
            __dirname, './fixtures/action-parse/parse-simple/action.json'));
        Assert.deepEqual(require('./fixtures/action-parse/parse-simple/expected-actions.json'),
            actions);

        actions = await parseAction(Path.resolve(
            __dirname, './fixtures/action-parse/parse-simple/action-flat.json'));
        Assert.deepEqual(require('./fixtures/action-parse/parse-simple/expected-actions-flat.json'),
            actions);

        actions = await parseAction(Path.resolve(
            __dirname, './fixtures/action-parse/parse-simple/action-empty.json'));
        Assert.deepEqual([],
            actions);

        actions = await parseAction(Path.resolve(
            __dirname, './fixtures/action-parse/parse-simple/action-array.json'));
        Assert.deepEqual([],
            actions);
    });

    test('should parse action.json, complex', async () => {
        const content = Fs.readFileSync(Path.resolve(
            __dirname, './fixtures/action-parse/parse-complex/action.json')).toString();
        // use action proxy to cover code coverage as well
        const stmts = require('../action')()('parse', `exports=${content}`);
        Assert.deepEqual(
            require('./fixtures/action-parse/parse-complex/expected.json'), stmts);

        const actions = await parseAction(Path.resolve(
            __dirname, './fixtures/action-parse/parse-complex/action.json'));
        Assert.deepEqual(require('./fixtures/action-parse/parse-complex/expected-actions.json'),
            actions);
    });
});
