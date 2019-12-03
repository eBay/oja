'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

const Actions = require('../lib/actions');

/**
 * Provides generic action to lib/actions.js functions
 */
module.exports = () => (command, ...args) => Actions[command](...args);
