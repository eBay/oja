'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

const caller = require('caller');

const callerLocationSymbol = Symbol.for('callerLocation');

/**
 * Creates a context out of functions and properties.
 *
 * The function must be of the following signature "context => (args) => value",
 * which is function factory with injected context that will be created by
 * runtime and passed to every factory function before execution of the returned function instance
 */
module.exports = (opts = {}) => {
    if (opts instanceof Function) {
        const factory = opts;
        // eslint-disable-next-line no-shadow
        return opts => createContext({
            ... opts,
            baseContext: factory(opts)
        });
    }

    return createContext({ ... opts });

    function normalizeActionRequest(actionRequest, systemSelectors) {
        if (typeof actionRequest === 'string') {
            return systemSelectors ? { namespace: actionRequest, selectors: systemSelectors } : {
                namespace: actionRequest
            };
        }
        const { name, ...selectors } = actionRequest;
        const addSelectors = { ...(systemSelectors), ...(selectors) };
        return Object.keys(addSelectors).length ? {
            namespace: name,
            selectors: addSelectors
        } : {
            namespace: name
        };
    }

    function createContext({
        functions = {},
        properties = {},
        baseContext = {},
        resolve,
        selectors
    }) {
        const actions = {};
        Object.assign(baseContext, {
            async proxyAction(callerLocation, actionRequest, ...args) {
                // eslint-disable-next-line no-param-reassign
                actionRequest = normalizeActionRequest(actionRequest, selectors);
                // use cache per caller location
                // each location can match different versions of the same action
                // based on selectors
                const actionsByLocation = actions[callerLocation] = actions[callerLocation] || {};
                let action = actionsByLocation[actionRequest.namespace];
                if (!action) {
                    // allow override
                    if (functions.hasOwnProperty(actionRequest.namespace)) {
                        // init once
                        action = await initAct(functions[actionRequest.namespace], callerLocation);
                    }
                    else if (resolve) {
                        // resolve
                        action = resolve(actionRequest, callerLocation);
                        if (action) {
                            // init once
                            action = await initAct(action, callerLocation);
                        }
                    }
                    if (!action) {
                        throw new Error(`Cannot find action "${actionRequest.namespace}"`);
                    }
                    // remember
                    actionsByLocation[actionRequest.namespace] = action;
                }
                return action(...args);
            },

            async action(actionRequest, ...args) {
                return this.proxyAction(caller(1), actionRequest, ...args);
            }
        });

        Object.assign(baseContext, properties, {
            initAct
        });

        return baseContext;

        async function initAct(act, callerLocation) {
            if (act instanceof Function) {
                act = await act(baseContext, {
                    [callerLocationSymbol]: callerLocation
                });
                if (act instanceof Function) {
                    return act;
                }
            }
            if (act instanceof Error) {
                return () => {
                    throw act;
                };
            }
            return () => act;
        }
    }
};
