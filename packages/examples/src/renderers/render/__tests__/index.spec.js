'use strict';

const Assert = require('assert');
const { EventEmitter } = require('events');

const { createContext } = require('@ebay/oja-action');

describe(__filename, () => {
    test('action render should fail', async() => {
        const context = await createContext({
            functions: {
                'RENDERERS/render': new Error('BOOM')
            },
            selectors: {
                env: 'production'
            }
        });
        try {
            await context.action('RENDERERS/render');
        } catch (err) {
            Assert.equal('BOOM', err.message);
        }
    });

    test('action render should be called', async() => {
        const response = Object.assign(new EventEmitter(), {
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

        const context = await createContext({
            properties: {
                response
            },
            selectors: {
                env: 'production'
            }
        });
        let rendered;
        await context.action('RENDERERS/render', {
            template: {
                render(model, out) {
                    rendered = true;
                    setImmediate(() => out.end());
                }
            },
            model: {}
        });

        Assert.ok(rendered);
    });

    test('action render some content', async() => {
        const response = Object.assign(new EventEmitter(), {
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

        const context = await createContext({
            properties: {
                response
            },
            selectors: {
                env: 'production'
            }
        });

        await context.action('RENDERERS/render', {
            template: {
                render(model, out) {
                    Assert.equal('bar', model.foo);
                    out.write('data1');
                    out.write('data2');
                    setImmediate(() => out.end());
                }
            },
            model: {
                foo: 'bar'
            }
        });

        Assert.equal('data1,data2,', response.data.join());
    });
});