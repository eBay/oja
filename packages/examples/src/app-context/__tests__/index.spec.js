'use strict';

const Assert = require('assert');
const { EventEmitter } = require('events');
const { createExpressHandler } = require('..');
require('marko/node-require').install();

describe(__filename, () => {
    test('should render item page', async () => {
        let error;
        const itemHandler = createExpressHandler('item');
        const res = Object.assign(new EventEmitter(), {
            data: [],
            headers: {},
            setHeader(name, value) {
                this.headers[name] = value;
            },
            write(content) {
                return this.data.push(content);
            },
            end(content) {
                content && this.data.push(content);
                setImmediate(() => this.emit('finish'));
            }
        });
        await itemHandler({}, res, err => {
            error = err;
        });
        // validate
        Assert.ok(!error, error && error.stack);
        Assert.equal('<!doctype html><html><body><div class="content"><div>Item: nike</div><div>Description: Nike Air Max Torch 4 IV Running Cross Training Shoes Sneakers NIB MENS</div><div>Description: 49.99</div><div>Seller: john</div><div>Shipping options:</div><select><option value="3day-shipping">Three day shipping</option><option value="2day-shipping">Two day shipping</option><option value="same-day-shipping">Same day shipping</option></select></div></body></html>', res.data.join(''));
    });
})