'use strict';

const Assert = require('assert');

describe(__filename, () => {
    it('should expose resolver', () => {
        const {
            resolveAllActions,
            resolveFirstAction,
            resolve
        } = require('../resolver');
        Assert.ok(resolveAllActions);
        Assert.ok(resolveFirstAction);
        Assert.ok(resolve);
    });
});
