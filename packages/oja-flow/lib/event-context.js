'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

const { EventEmitter } = require('events');

class EventContext {
    constructor(context) {
        if (context instanceof EventContext) {
            // share the same context
            this._resolved = context._resolved;
            this._context = context._context;
            this._emitter = context._emitter;
            this._queue = context._queue;
            return;
        }
        // new context
        this._resolved = {};
        this._context = {};
        this._queue = {};
        Object.assign(this._context, context);
        this._emitter = new EventEmitter();
        // increase limit to accomodate big networks of components where
        // everyone listens to error
        this._emitter.setMaxListeners(20);
    }

    stageContext(topics) {
        if (topics && !Array.isArray(topics)) {
            topics = [].slice.call(arguments);
        }

        // eslint-disable-next-line no-use-before-define
        return new StageContext(this, topics);
    }

    /*
        Returns a list of topics that have not been resolved yet
    */
    state() {
        const queueState = Object.keys(this._queue).reduce((memo, topic) => {
            const queue = this._queue[topic];
            if (queue && queue.length) {
                memo[topic] = queue.length;
            }
            return memo;
        }, {});
        const pending = Object.keys(this._resolved).reduce((memo, name) => {
            if (!this._resolved[name]) {
                memo.push(name);
            }
            return memo;
        }, []);

        return {
            queue: queueState,
            pending: pending
        };
    }

    repub(type, handler) {
        // mark if any new topics have been added and marko them as non-resolved
        if (type !== 'error' && this._resolved[type] === undefined) {
            this._resolved[type] = false;
        }
        if (type === '*') {
            // re-publish all events
            Object.keys(this._queue).forEach(name => {
                const evts = this._queue[name];
                evts.forEach(evt => {
                    handler({
                        name: name,
                        data: evt
                    });
                });
            });
            return;
        }
        const queue = this._queue[type];
        if (queue) {
            queue.forEach(evt => handler(evt));
        }
    }

    /*
      Add a listener for a stream parameter.
    */
    on(type, handler) {
        this.repub(type, handler);
        this._emitter.on(type, handler);

        return this;
    }

    once(type, handler) {
        this.repub(type, handler);
        this._emitter.once(type, handler);

        return this;
    }

    emit(name, value) {
        this._queue[name] = this._queue[name] || [];
        this._queue[name].push(value);

        const doEmit = () => {
            this._emitter.emit(name, value);
        };

        if (name === 'error') {
            this._context._lastError = value;
            doEmit();
        }
        else {
            // mark as resolved
            this._resolved[name] = true;
        }

        if (!this._context._lastError) {
            doEmit();
        }

        setImmediate(() => {
            this._emitter.emit('*', {
                name: name,
                data: value
            });
        });
        return this;
    }

    /*
      Returns value from the context.
      If value is not yet published, it will return a promise
    */
    get(name) {
        const value = this._context[name] = this._context[name] || new Promise((resolve, reject) => {
            // this.once(name, resolve);
            this.once(name, data => {
                resolve(data);
            });

            this.once('error', reject);
        });
        return value;
    }
}

class StageContext extends EventContext {
    constructor(eventContext, topics) {
        super(eventContext);
        this.topics = topics;
    }

    pub(data) {
        if (this._context._lastError) {
            // flow is already broken
            return;
        }
        if (data instanceof Error) {
            this._context._lastError = data;
            return setImmediate(() => super.emit('error', data));
        }
        // otherwise publish normally
        (this.topics || ['data']).forEach(topic => {
            super.emit(topic, data);
        });
    }
}

module.exports = EventContext;
