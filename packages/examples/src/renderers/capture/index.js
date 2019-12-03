'use strict';

const { EventEmitter } = require('events');

/**
 * Action: capture
 * Domain: renderers
 */
module.exports = context => async({ template, model }) => {
    const output = Object.assign(new EventEmitter(), {
        data: [],
        headers: {},
        setHeader(name, value) {
            this.headers[name] = value;
        },
        write(content) {
            return this.data.push(content);
        },
        end(content) {
            this.data.push(content);
            setImmediate(() => this.emit('finish'));
        }
    });

    // here we still use flow which is convenient to control marko template data rendering
    template.render(model, output);

    // wait till we done in case one needs to know the moment
    // usually in unit tests
    return new Promise(resolve => {
        output.once('finish', () => {
            resolve({
                headers: output.headers,
                body: output.data.join('')
            });
        });
    });
};