'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

module.exports = context => (eventType, ...args) => context.action('oja/pubsub', 'route', eventType, ...args);
