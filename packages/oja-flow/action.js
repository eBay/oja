'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

const Assert = require('assert');
const Flow = require('./flow');

class Action extends Flow {
    constructor() {
        super();

        this.actions = [];
        this.executed = false;
    }

    execute() {}

    activate() {
        // starts the action
        if (this.executed) {
            return this;
        }
        this.executed = true;
        this.execute();
        this.actions.forEach(action => action.activate());

        return this;
    }

    add(action) {
        let actions = [];
        if (arguments.length > 1) {
            actions = actions.concat([].slice.call(arguments));
        }
        else {
            if (Array.isArray(arguments[0])) {
                actions = actions.concat(arguments[0]);
            }
            else {
                actions.push(arguments[0]);
            }
        }

        // eslint-disable-next-line no-shadow
        actions.forEach(action => {
            if (typeof action === 'function') {
                // eslint-disable-next-line no-use-before-define
                action = new FunctionAction(action);
            }
            Assert.ok(action instanceof Action, 'The action beeing added does not of Action type');
            if (action.executed) {
                throw new Error('The action should not be in progress when it is added to the other action');
            }
            // remap to basec context
            action.setEventContext(this.eventContext);
            this.actions.push(action);
        });

        return this;
    }

    setEventContext(eventContext) {
        this.eventContext = eventContext;
        this.actions.forEach(action => {
            action.setEventContext(eventContext);
        });
    }
}

class FunctionAction extends Action {
    constructor(fun) {
        super();
        this.fun = fun;
    }

    execute() {
        return this.fun(this);
    }
}

module.exports = Action;
