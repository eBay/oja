'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

const Flow = require('./flow');

const END_OF_STREAM = Symbol('eos');
const add = Symbol('add');
const unwrap = Symbol('unwrap');
const nextTopicSymbol = Symbol('nextTopic');
const prevTopicSymbol = Symbol('prevTopic');

class ErrorContainer {
    constructor(error, index = 0) {
        this.error = error;
        this.index = index;
    }
}

class DataContainer {
    constructor(data, index = 0) {
        this.data = data;
        this.index = index;
    }
}

/**
 * The pipe class provides a way to build asynchronous pipelines with map/reduce where
 * each item travels in parallel to the reduce handler
 */
class Pipe {
    constructor() {
        this.handlers = [];
    }

    static [add](handlers, handler) {
        handlers.push(handler);
        const nextTopic = Pipe[nextTopicSymbol](handlers);
        const prevTopic = Pipe[prevTopicSymbol](handlers);
        return [prevTopic, nextTopic];
    }

    static [nextTopicSymbol](handlers) {
        return `phase_${handlers.length}`;
    }

    static [prevTopicSymbol](handlers) {
        return `phase_${handlers.length - 1}`;
    }

    safeCall(fn) {
        if (!fn) {
            return fn;
        }
        return async (data, index, accumulator) => {
            try {
                if (data instanceof ErrorContainer) {
                    index = data.index;
                    data = data.error;
                }
                else if (data instanceof DataContainer) {
                    index = data.index;
                    data = data.data;
                }
                accumulator = accumulator instanceof DataContainer ? accumulator.data : accumulator;
                data = await (accumulator ?
                    fn(accumulator, data, index) : fn(data, index));
                data = data === undefined ? null : data;
                return new DataContainer(data, index);
            }
            catch (error) {
                // prevent error from stopping the flow
                return new ErrorContainer(error, index);
            }
        };
    }

    catch(fn) {
        fn = this.safeCall(fn);
        const [prevTopic, nextTopic] = Pipe[add](this.handlers, context => {
            context.streamData[nextTopic] = context.streamData[prevTopic];
            const rets = [];
            context.consume(prevTopic, async data => {
                if (data !== END_OF_STREAM) {
                    const ret = data instanceof ErrorContainer ?
                        fn(data) :
                        Promise.resolve(data);
                    rets.push(ret);
                    context.define(nextTopic, ret);
                    return;
                }
                if (context.streamData[nextTopic]) {
                    // use promise all to keep order of events and block end of stream till all promises are resolved
                    rets.length > 0 && await Promise.all(rets);
                    context.define(nextTopic, END_OF_STREAM);
                }
            });
        });
        return this;
    }

    next(fn) {
        fn = this.safeCall(fn);
        const [prevTopic, nextTopic] = Pipe[add](this.handlers, context => {
            context.streamData[nextTopic] = context.streamData[prevTopic];
            const rets = [];
            context.consume(prevTopic, async data => {
                if (data !== END_OF_STREAM) {
                    const ret = fn(data);
                    rets.push(ret);
                    context.define(nextTopic, ret);
                    return;
                }
                await Promise.all(rets);
                context.define(nextTopic, END_OF_STREAM);
            });
        });
        return this;
    }

    map(fn = itm => itm) {
        fn = this.safeCall(fn);
        const [prevTopic, nextTopic] = Pipe[add](this.handlers, context => {
            context.streamData[nextTopic] = true;
            context.consume(prevTopic, async data => {
                if (!Array.isArray(data.data)) {
                    context.define(nextTopic,
                        new ErrorContainer(new Error(`map requires array data ${data.data}`)));
                    context.define(nextTopic, END_OF_STREAM);
                    return;
                }
                // use promise all to keep order of events and block end of stream till all promises are resolved
                await Promise.all(data.data.map((itm, index) => {
                    const ret = fn(itm, index);
                    context.define(nextTopic, ret);
                    return ret;
                }));
                context.define(nextTopic, END_OF_STREAM);
            });
        });
        return this;
    }

    filter(fn) {
        fn = this.safeCall(fn);
        const [prevTopic, nextTopic] = Pipe[add](this.handlers, context => {
            const rets = []; // use to preserve order
            context.streamData[nextTopic] = true;
            context.consume(prevTopic, async data => {
                if (context.streamData[prevTopic]) {
                    if (data !== END_OF_STREAM) {
                        const ret = fn(data);
                        rets.push(ret);
                        if ((await ret).data === true) {
                            context.define(nextTopic, data);
                        }
                        return;
                    }
                    await Promise.all(rets);
                    context.define(nextTopic, END_OF_STREAM);
                    return;
                }
                if (!Array.isArray(data.data)) {
                    context.define(nextTopic,
                        new ErrorContainer(new Error(`filter requires array data ${data.data}`)));
                    context.define(nextTopic, END_OF_STREAM);
                    return;
                }
                // use promise all to keep order of events and block end of stream till all promises are resolved
                await Promise.all(data.data.map(async (itm, index) => {
                    if ((await fn(itm, index)).data === true) {
                        context.define(nextTopic, new DataContainer(itm, index));
                    }
                }));
                context.define(nextTopic, END_OF_STREAM);
            });
        });
        return this;
    }

    merge(fn) {
        fn = this.safeCall(fn);
        const [prevTopic, nextTopic] = Pipe[add](this.handlers, context => {
            if (!context.streamData[prevTopic]) {
                context.define(nextTopic,
                    new ErrorContainer(new Error(`merge requires mapped data`)));
                return;
            }
            const accumulator = {};
            context.consume(prevTopic, data => {
                if (data === END_OF_STREAM) {
                    const ret = fn ? fn(accumulator) : new DataContainer(accumulator);
                    context.define(nextTopic, ret);
                    return;
                }
                Object.assign(accumulator, data.data);
            });
        });
        return this;
    }

    reduce(fn, accumulator = []) {
        fn = fn || ((memo, itm) => {
            memo.push(itm);
            return memo;
        });
        fn = this.safeCall(fn);
        const [prevTopic, nextTopic] = Pipe[add](this.handlers, context => {
            if (!context.streamData[prevTopic]) {
                context.define(nextTopic,
                    new ErrorContainer(new Error(`reduce requires mapped data`)));
                return;
            }

            const rets = [];
            context.consume(prevTopic, async data => {
                if (data === END_OF_STREAM) {
                    await Promise.all(rets);
                    context.define(nextTopic, accumulator);
                    return;
                }
                const ret = fn(data.data, data.index, accumulator);
                rets.push(ret);
                accumulator = await ret;
            });
        });
        return this;
    }

    static [unwrap](handlers) {
        const [prevTopic, nextTopic] = Pipe[add](handlers, context => {
            context.consume(prevTopic, data => {
                if (data instanceof ErrorContainer) {
                    // throw data.error;
                    context.define(nextTopic, data.error);
                    return;
                }
                if (data === END_OF_STREAM) {
                    context.define(nextTopic, null);
                    return;
                }
                context.define(nextTopic, data.data);
            });
        });
        return this;
    }

    build() {
        const handlers = this.handlers.slice(0);
        // unwrap data handler
        Pipe[unwrap](handlers);

        return properties => (...incoming) => {
            if (incoming.length === 1) {
                incoming = incoming[0];
            }
            const context = Object.assign(new Flow(), {
                streamData: {}
            }, properties);

            handlers.forEach(handler => {
                handler(context);
            });

            context.define('phase_0', new DataContainer(incoming));
            const topic = Pipe[nextTopicSymbol](handlers);
            if (context.streamData[Pipe[prevTopicSymbol](handlers)]) {
                return context.consumeStream(topic);
            }
            return context.consume(topic);
        };
    }
}

module.exports = Pipe;

Pipe.END_OF_STREAM = END_OF_STREAM;
