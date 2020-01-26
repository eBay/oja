'use strict';

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');

const {
    findActionStatements,
    parse,
    createValidator,
    loadActionStatements
} = require('../index');

describe(__filename, () => {
    test('should find action statements', () => {
        const stmts = findActionStatements(require('./fixtures/ast-details.json'));
        Assert.deepEqual(require('./fixtures/ast-details-stmts.json'), stmts);
    });

    test('should handle with comments', () => {
        const code = Fs.readFileSync(Path.resolve(
            __dirname, './fixtures/code.js')).toString();
        const stmts = parse(code);
        Assert.deepEqual(require('./fixtures/code.json'),
            findActionStatements(stmts));
    });

    test('should handle complex action expression, array', () => {
        const code = Fs.readFileSync(Path.resolve(
            __dirname, './fixtures/code-action-request.js')).toString();
        const stmts = parse(code);
        Assert.deepEqual(require('./fixtures/code-action-request-stmts.json'),
            findActionStatements(stmts));
    });

    test('should parse action, edge case', async () => {
        const jsFile = Path.resolve(
            __dirname, './fixtures/template-edge-case.js');
        const code = Fs.readFileSync(jsFile).toString();
        const stmts = parse(code);
        const actions = findActionStatements(stmts);
        Assert.deepEqual(require('./fixtures/template-edge-case.json'),
            actions);
        Assert.deepEqual(require('./fixtures/template-edge-case.json'),
            await loadActionStatements(jsFile));
    });

    test('should validate action with template', async () => {
        const validate = await createValidator();
        const errors = await validate(Path.resolve(
            __dirname, './fixtures/template-edge-case.js'));
        Assert.deepEqual(0, errors.length);
    });

    test('should handle parse error', async () => {
        const validate = await createValidator();
        const errors = await validate(Path.resolve(
            __dirname, './fixtures/parse-error.js'));
        Assert.deepEqual(1, errors.length);
        Assert.equal('Line 1: Unexpected token var', errors[0].message);
        Assert.ok(errors[0].path);
    });

    test('should handle empty expression', async () => {
        const validate = await createValidator();
        const errors = await validate(Path.resolve(
            __dirname, './fixtures/empty-spread.js'));
        Assert.deepEqual(0, errors.length);
    });

    test('should handle unexpected error', async () => {
        const validate = await createValidator();
        const errors = await validate(Path.resolve(
            __dirname, './fixtures/non-existant.js'));
        Assert.deepEqual(1, errors.length);
    });
});
