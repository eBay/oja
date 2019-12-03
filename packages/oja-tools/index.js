'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

/**
 * Defines a pipe action that would start a pipeline of actions executed one by one
 * in the order defined by config.pipe.
 * 
 * A pipe handler is a function: context => async next => {}
 */
module.exports = context => {
    return config => {
        const pipe = config.pipe;
        let position = 0;

        const cycle = async (...args) => {
            const actionName = pipe[position];
            position++;
            try {
                return await context.action(actionName, ...args, (...newArgs) => {
                    if (newArgs.length) {
                        return cycle(...newArgs);
                    }
                    return cycle(...args);
                });
            }
            finally {
                position--; // good for retry
            }
        };

        return cycle;
    };
};
