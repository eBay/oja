'use strict';

const Assert = require('assert');
const { createContext } = require('@ebay/oja-action');
require('marko/node-require').install();

describe(__filename, () => {
    test('action item should fail', async () => {
        const context = await createContext({
            functions: {
                'CONTROLLERS/item': new Error('BOOM')
            }
        });
        try {
            await context.action('CONTROLLERS/item');
        }
        catch (err) {
            Assert.equal('BOOM', err.message);
        }
    });

    test('should render page with empty mock data', async () => {
        const context = await createContext({
            functions: {
                'ACTIONS/itemDetails': Promise.resolve({}),
                'ACTIONS/sellerInfo': {},
                'ACTIONS/userDetails': {},
                'ACTIONS/calculateRates': {},
            }
        });

        const ret = await context.action('CONTROLLERS/item');
        const { template, model } = ret;

        Assert.ok(template);
        Assert.deepEqual({
            sellerInfo: {},
            buyerInfo: {},
            rates: {},
            itemDetails: {}
        }, model);
    });

    test('should render page', async () => {
        const context = await createContext({
            functions: {
                'ACTIONS/itemDetails': Promise.resolve(require('mock-data/item-details.json')),
                'ACTIONS/sellerInfo': require('mock-data/seller-info.json'),
                'ACTIONS/userDetails': require('mock-data/user-info.json'),
                'ACTIONS/calculateRates': require('mock-data/shipping-info.json')
            }
        });

        const { template, model } = await context.action('CONTROLLERS/item');
        Assert.ok(template);
        Assert.deepEqual({
            itemDetails: require('mock-data/item-details.json'),
            sellerInfo: require('mock-data/seller-info.json'),
            buyerInfo: require('mock-data/user-info.json'),
            rates: require('mock-data/shipping-info.json')
        }, model);
    });

    test('should handle failed shipping service', async () => {
        const context = await createContext({
            functions: {
                'ACTIONS/itemDetails': Promise.resolve({}),
                'ACTIONS/sellerInfo': {},
                'ACTIONS/userDetails': {},
                'ACTIONS/calculateRates': new Error('Boom')
            }
        });

        const { model } = await context.action('CONTROLLERS/item');
        Assert.deepEqual({
            sellerInfo: {},
            buyerInfo: {},
            rates: {
                error: 'Shipping is temporary not available'
            },
            itemDetails: {}
        }, model);
    });

    test('should render page with real data', async () => {
        const context = await createContext();
        const { model } = await context.action('CONTROLLERS/item');
        Assert.deepEqual({
            "itemDetails": {
                "id": 1234,
                "title": "nike",
                "description": "Nike Air Max Torch 4 IV Running Cross Training Shoes Sneakers NIB MENS",
                "sellerId": "seller123",
                "price": 49.99
            },
            "sellerInfo": {
                "username": "john",
                "location": {
                    "zip": 12345
                }
            },
            "buyerInfo": {
                "username": "bob",
                "location": {
                    "zip": 34527
                }
            },
            "rates": [
                {
                    "name": "3day-shipping",
                    "desc": "Three day shipping",
                    "rate": 6.99
                },
                {
                    "name": "2day-shipping",
                    "desc": "Two day shipping",
                    "rate": 9.99
                },
                {
                    "name": "same-day-shipping",
                    "desc": "Same day shipping",
                    "rate": 15.99
                }
            ]
        }, model);
    });
});