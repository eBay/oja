'use strict';
const Actions = require('../lib/actions');

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

module.exports = context => {
    Actions.resetCache();
    // alow extend reset
    // the reset extension should use pub/sub to notify all subscribers
    return context.action('oja/extension', 'oja/extension/context/reset');
};
