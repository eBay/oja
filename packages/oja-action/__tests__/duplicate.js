/* eslint-disable no-undef */
'use strict';

const Assert = require('assert');

describe(__filename, () => {
    test('should produce warning about duplicate actions found', async () => {
        console.warn = jest.fn();
        const act = require('./fixtures/dup/index');
        Assert.equal('bardup', await act('BARNS/bar'));
        expect(console.warn.mock.calls[0][0]).toMatch(/Found duplicate action "BARNS\/bar", existing action/);
        expect(console.warn.mock.calls[0][0]).toMatch(/fixtures\/dup\/modules\/deep\/down\/rabit\/hole/);
        expect(console.warn.mock.calls[0][0]).toMatch(/__tests__\/fixtures\/dup\/modules\/bar\/index/);
        const dups = await act('oja/action', 'getDuplicateActions');
        Assert.equal(1, Object.keys(dups).length);
        Assert.equal(2, dups['BARNS/bar'].length);
        Assert.equal('BARNS/bar', dups['BARNS/bar'][0][Symbol.for('oja@action')].namespace);
        Assert.equal('2.0.0', dups['BARNS/bar'][0][Symbol.for('oja@action')].version);
    });
});
