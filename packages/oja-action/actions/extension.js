'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

const Actions = require('../lib/actions');

module.exports = context => async (namespace, caller, ...args) => {
    // eslint-disable-next-line no-param-reassign
    caller = caller || process.cwd();
    const action = Actions.resolve({ namespace }, caller);
    if (action) {
        const fn = await action(context);
        if (fn instanceof Function) {
            return fn(...args);
        }
        return fn;
    }
};
