'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

module.exports = context => {
    // keep pub/sub state here
    const subscriptions = {};

    return (operation, ...args) => {
        switch (operation) {
            case 'dispatch':
                return dispatch(...args);
            case 'subscribe':
                return subscribe(...args);
            case 'unsubscribe':
                return unsubscribe(...args);
            default:
        }
    };

    function subscribe(eventType, listener) {
        const subs = subscriptions[eventType] = subscriptions[eventType] || [];
        subs.push(listener);
        // return the listener back for convenience
        return listener;
    }

    function unsubscribe(eventType, listener) {
        const subs = subscriptions[eventType] = subscriptions[eventType] || [];
        const pos = subs.indexOf(listener);
        if (pos > -1) {
            subs.splice(pos, 1);
            return true;
        }
        return false;
    }

    function dispatch(eventType, data) {
        const subs = subscriptions[eventType] || [];
        return Promise.all(subs.map(action => action(eventType, data)));
    }
};
