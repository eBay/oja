'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

const { resolve, annotate } = require('./lib/actions');

const createContextFactory =
module.exports = async (options = {}) => {
    // for now async is used to denote that in future the factory may be async
    // and force people use await for context creation
    const {
        createContext = require('@ebay/oja-context'),
        functions,
        selectors
    } = options;

    // eslint-disable-next-line no-const-assign
    const properties = Object.assign({}, options.properties, {
        annotate
    });

    // create base/bootstrap context
    // to get initial actions
    const baseContext = await createContext({
        resolve: options.resolve || resolve,
        properties,
        functions,
        selectors
    });

    // allow platform or app to re-configure/add to the context
    // eslint-disable-next-line no-param-reassign
    options = await baseContext.action({
        name: 'oja/configure',
        '~override': true
    }, options);

    return (runtimeOptions = {}) => createContext({
        resolve: options.resolve || resolve,
        properties: Object.assign(properties,
            options.properties, runtimeOptions.properties),
        functions: Object.assign({}, functions,
            options.functions, runtimeOptions.functions),
        selectors: Object.assign({}, selectors,
            options.selectors, runtimeOptions.selectors)
    });
};

// provide default context creation, i.e. shortcut
module.exports.createContext = async options => {
    if (!module.exports.defaultFactory) {
        module.exports.defaultFactory = await createContextFactory();
    }
    return module.exports.defaultFactory(options);
};