'use strict';

const Assert = require('assert');
const Path = require('path');

const {
    createValidator
} = require('../index');

describe(__filename, () => {
    test('should simple action.json', async () => {
        const validate = await createValidator();
        let errors = await validate(Path.resolve(
            __dirname, './fixtures/action-validation/simple/action.json'));
        Assert.deepEqual([], errors);

        // should catch some errors
        errors = await validate(Path.resolve(
            __dirname, './fixtures/action-validation/simple-invalid/action.json'));
        Assert.equal(1, errors.length);
        Assert.ok(/Cannot locate action/.test(errors[0].message));
        Assert.deepEqual({
            'type': 'Literal',
            'value': 'foo',
            'raw': '\"foo\"',
            'loc': {
                'start': {
                    'line': 3,
                    'column': 15
                },
                'end': {
                    'line': 3,
                    'column': 20
                }
            }
        }, errors[0].function);
        Assert.deepEqual({
            'loc': {
                'end': {
                    'column': 13,
                    'line': 3
                },
                'start': {
                    'column': 4,
                    'line': 3
                }
            },
            'raw': '\"FOO/foo\"',
            'type': 'Literal',
            'value': 'FOO/foo'
        }, errors[0].namespace);
        Assert.equal('error', errors[0].codeType);
        Assert.ok(/action-validation\/simple-invalid\/action\.json/.test(errors[0].path));
    });

    test('should validate complex action.json', async () => {
        const validate = await createValidator();
        const errors = await validate(Path.resolve(
            __dirname, './fixtures/action-validation/complex/action.json'));
        Assert.deepEqual(2, errors.length);
    });

    test('should validate invalid action.json', async () => {
        const validate = await createValidator();
        const errors = await validate(Path.resolve(
            __dirname, './fixtures/action-validation/invalid/action.json'));
        Assert.deepEqual(1, errors.length);
        Assert.deepEqual(require('./fixtures/action-validation/invalid/expected-error.json'),
            errors.map(error => {
                error.path = error.path.replace(__dirname, '');
                error.message = error.message.replace(__dirname, '');
                return error;
            }));
    });
});
