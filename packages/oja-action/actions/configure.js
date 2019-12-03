'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

module.exports = () => options =>
    // nothing to init
    // use this phase to inject platform specific virtual actions
    // the virtual action is action not physically represented and created
    // based on some metadata as a wrapper around it.
    options
;
