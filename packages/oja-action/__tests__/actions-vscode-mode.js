/* eslint-disable no-undef */
/* eslint-disable new-cap */
'use strict';

const Assert = require('assert');
const Actions = require('../lib/actions');
const { resetCache } = Actions;

describe(__filename, () => {
    beforeAll(() => {
        process.env.VS_CODE_OJA_EXTENSION = 'true';
    });

    require('./fixtures/action-tests')('actions-vscode');

    describe('should reset cache', () => {
        beforeAll(() => {
            Assert.ok(Object.keys(Actions.cache).length);
            resetCache();
            Assert.equal(0, Object.keys(Actions.cache).length);
        });

        require('./fixtures/action-tests')('actions-vscode-reset');
    });
});
