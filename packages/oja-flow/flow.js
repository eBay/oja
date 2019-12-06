'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

const EventContext = require('./lib/event-context');
const { ReadableStream } = require('./lib/streaming');

class Flow {
    constructor(baseFlow) {
        if (baseFlow) {
            this.eventContext = baseFlow.eventContext;
            return;
        }
        // eslint-disable-next-line no-use-before-define
        this.eventContext = new EventContext();
    }

    setMaxListeners(value) {
        this.eventContext._emitter.setMaxListeners(value);
    }

    /*
       Define a publisher with the given topic.
       define(topics[, callback])
       It supports the following calling styles
       - define('topic') defines publisher with the given topic.
            * If define return non-empty value (promise, eventemitter, object, etc.),
            it is assumed to be a result that gets published to the flow under the topic name.
       - define(['A', 'B']) defines publisher with the given topics.
       - define('topic', callback) defines a publisher for in-line functions.
            * If callback is provided, it makes calls callback(publisher, runtime),
            where runtime is the reference to the flow object to allow further access to the flow inside arrow function
            * If callback return data, it is assumes to be the result and it gets published under topic.
       - define('topic', data) defines static data that gets published under the given topic immediately.
            * Notable side-effect: if one calls flow.define('foo', data) multiple time it is
            eqivaalent to emitting events

       Publisher API:
       - pub(data) publishes data under the assigned topic or publisher topic.
         It handles promises, events, plain data
    */
    define(topics, cb) {
        const publisher = this.eventContext.stageContext(topics);
        if (typeof cb === 'function') {
            const ret = cb(publisher, this);
            // keep cb returns something, treat is as a response
            if (ret !== undefined) {
                publisher.pub(ret);
            }
            return this; // to allow cascading style
        }
        if (cb instanceof Promise) {
            cb.then(data => publisher.pub(data))
                .catch(err => publisher.pub(err));
            return this;
        }
        if (cb !== undefined) {
            // assume it is a response
            publisher.pub(cb);
            return this;
        }
        // otherwise, it is sync mode, hence return publisher
        return publisher;
    }

    catch(callback) {
        if (arguments.length !== 1) {
            throw new Error('Invalid arguments');
        }
        this._catchHandler = err => {
            this._catchHandler = () => {};
            callback(err);
        };
        this.consume('error', this._catchHandler);
        return this;
    }

    timeout(topics, ms) {
        topics = Array.isArray(topics) ? topics : [topics];
        const timer = setTimeout(() => {
            const state = this.state();
            const pendingTopics = state.pending;

            const unresolved = [];
            const pending = [];
            pendingTopics.forEach(tp => {
                topics.indexOf(tp) !== -1 ?
                    unresolved.push(tp) :
                    pending.push(tp);
            });

            const queueState = `queue state ${JSON.stringify(state.queue)}`;
            const msg = `Topic/s (${unresolved.join(',')}) timed out, pending topics (${
                pending.join(',') || 'none'}), ${queueState}`;

            this.define('error',
                new Error(msg));
        }, ms);

        this
            .consume(topics)
            .then(() => clearTimeout(timer))
            .catch(() => clearTimeout(timer));

        return this;
    }

    /*
        Returns a list of topics that have not been resolved yet
    */
    state() {
        return this.eventContext.state();
    }

    /*
        Consumes given topics:
        consume(topics[, callback])
        API:
        - consume(topics) returns a map of promises mapped to each topic
        - consume(topic) returns a promise for the given topic
        - consume(topics, callback(input, runtime)) returns a map of resolved
            values for the given topics, where runtime is a reference to the flow instance
        - consume(topic, callback(data, runtime)) returns resolved value for the given topic,
            where runtime is a reference to the flow instance
    */
    consume(topics, cb) {
        if (Array.isArray(topics)) {
            if (cb) {
                Promise.all(topics.map(topic => this.eventContext.get(topic)))
                    .then(values => {
                        const ret = {};
                        values.map((val, index) => {
                            ret[topics[index]] = val;
                        });
                        // unlink any error in cb from promise flow to let it fail
                        setImmediate(() => cb(ret, this));
                    })
                    .catch(err => {
                        if (this._catchHandler) {
                            return this._catchHandler(err);
                        }
                    });
                return this; // for cascading style
            }

            const promises = topics.reduce((memo, topic) => {
                memo.push(this.eventContext.get(topic));
                return memo;
            }, []);

            return Promise.all(promises)
                .then(results => results.reduce((memo, data, index) => {
                    memo[topics[index]] = data;
                    return memo;
                }, {}));
        }

        // handle single topics
        if (cb) {
            this.eventContext.on(topics, data => {
                if (data instanceof Promise) {
                    data.then(cb).catch(err => {
                        this.define('error', err);
                    });
                    return;
                }

                cb(data, this);
            });
            return this;
        }
        return this.eventContext.get(topics);
    }

    /*
        Consumes stream for the given topic.
        Returns as readable stream
        The end of stream should be marked as undefined data
    */
    consumeStream(topic, callback) {
        // let's monitor end of stream to show in pending list if timeout happens
        this.consume(`${topic }:end`).catch(() => {});
        // eslint-disable-next-line no-use-before-define
        const stream = new ReadableStream(topic, this.eventContext);
        if (callback) {
            callback(stream);
            return this;
        }
        return stream;
    }

    /*
        Returns a reader for the given topic.
        It is useful when reading stream of events for the given topic.
        At the end of stream an undefined value will be returned.
        The reader returns a promise for async/await pattern.
    */
    getReader(topic) {
        const pending = [];
        const resolved = [];
        let completed = false;
        const stream = this.consumeStream(topic);

        function publish(data) {
            if (pending.length) {
                const resolve = pending.shift();
                return resolve(data);
            }
            resolved.push(data);
            if (data === undefined) {
                completed = true;
            }
        }

        stream.on('data', publish);
        stream.once('end', publish);

        return {
            next() {
                if (resolved.length) {
                    return Promise.resolve(resolved.shift());
                }
                if (completed) {
                    return Promise.reject(new Error(`The reader(${topic}) is already closed`));
                }
                return new Promise(resolve => {
                    pending.push(resolve);
                });
            }
        };
    }
}

module.exports = Flow;
