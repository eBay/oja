'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

/**
 */
module.exports = (context, config) => {
    return async (...args) => {
        const pipe = await context.action(config.action, config.arguments);
        return pipe(...args);
    };
};
