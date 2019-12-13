'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

const Assert = require('assert');
const createContext = require('ebay@oja-context');

// eslint-disable-next-line no-undef
jest.mock('caller');

let counter = 0;
const ctx = createContext({
    resolve: (actionRequest) => {
        counter++;
        return () => `hello from ${actionRequest.namespace}`;
    }
});

describe(__filename, () => {
    test('should cache actions per one caller location', async () => {
        require('caller').mockReturnValue('one-location');
        Assert.equal('hello from foo', await ctx.action('foo'));
        Assert.equal(1, counter);
        Assert.equal('hello from foo', await ctx.action('foo'));
        Assert.equal(1, counter);
    });

    test('should cache actions per the same one caller location', async () => {
        require('caller').mockReturnValue('one-location');
        Assert.equal('hello from foo', await ctx.action('foo'));
        Assert.equal(1, counter);
        Assert.equal('hello from foo', await ctx.action('foo'));
        Assert.equal(1, counter);
    });

    test('should cache actions per caller location', async () => {
        require('caller').mockReturnValue('other-location');
        Assert.equal('hello from foo', await ctx.action('foo'));
        Assert.equal(2, counter);
        Assert.equal('hello from foo', await ctx.action('foo'));
        Assert.equal(2, counter);
    });
});
