/* eslint-disable no-undef */
/* eslint-disable new-cap */
'use strict';

describe(__filename, () => {
    beforeAll(() => {
        delete process.env.VS_CODE_OJA_EXTENSION;
    });
    require('./fixtures/action-tests')('actions');
});
