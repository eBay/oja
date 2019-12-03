'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

const Actions = require('../lib/actions');

module.exports = async (context, { operation }) => {
    // allow platform or app to re-configure/add to the options
    // by default it will call default action (use selectors to override)
    // eslint-disable-next-line no-param-reassign
    const options = await context.action({
        name: 'oja/configure',
        '~override': true
    });

    // we are interested in functions attribute
    // to build our virtual actions
    // and wrap them into the same action wrapper with attributes
    const vactions = await convertFunctionsToActions(options && options.functions);

    return async (namespace, path) => {
        // then get discoverable actions
        const actions = Actions[operation](namespace, Actions.moduleRoot(path));
        if (!vactions || Object.keys(vactions).length === 0) {
            return actions;
        }
        // otherwise append
        if (vactions[namespace]) {
            return appendActions([], vactions[namespace], actions);
        }
        else if (namespace === '*') {
            return Object.keys(vactions).reduce((memo, ns) =>
                appendActions(memo, vactions[ns]), appendActions([], actions));
        }
        return actions;
    };

    async function convertFunctionsToActions(functions) {
        const actions = {};
        const keys = functions && Object.keys(functions) || [];
        for (let i = 0; i < keys.length; i++) {
            const ns = keys[i];
            const func = functions[ns];
            const action = await context.initAct(func);
            actions[ns] = Actions.annotate(action, {
                namespace: ns,
                [Symbol.for('oja@location')]: () => func.location || 'inline',
                [Symbol.for('oja@key')]: ''
            });
        }
        return actions;
    }
};

function appendActions(dest, ...src) {
    src.forEach(action => {
        const actions = Array.isArray(action) &&
            action || [action];
        dest.push(...actions);
    });
    return dest;
}
