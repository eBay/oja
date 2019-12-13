'use strict';

const template = require('./index.marko');

/**
 * Action: item
 * Domain: controllers
 */
module.exports = context => async parameters => {
    // get item details
    const itemDetailsPromise = context.action('ACTIONS/itemDetails', context.itemId);
    // get seller info
    const sellerInfoPromise = getSellerInfo();
    // get buyer infos
    const buyerInfoPromise = context.action('ACTIONS/userDetails', context.userId);
    // wait for seller and buyer info before we can calculate shipping rates
    const ratesPromise = getRates();
    // build data model and render
    const [itemDetails, sellerInfo, buyerInfo, rates] =
        await Promise.all([itemDetailsPromise, sellerInfoPromise, buyerInfoPromise, ratesPromise]);
    // return for unit test or final render action
    return {
        template,
        model: {
            itemDetails,
            sellerInfo,
            buyerInfo,
            rates
        }
    };

    async function getRates() {
        try {
            // eslint-disable-next-line no-shadow
            const [buyerInfo, sellerInfo] = await Promise.all([buyerInfoPromise, sellerInfoPromise]);
            // calc rates
            return await context.action('ACTIONS/calculateRates',
                sellerInfo.zipCode,
                buyerInfo.zipCode);
        }
        catch (err) {
            return {
                error: 'Shipping is temporary not available'
            };
        }
    }

    async function getSellerInfo() {
        // eslint-disable-next-line no-shadow
        const itemDetails = await itemDetailsPromise;
        return context.action('ACTIONS/sellerInfo', itemDetails.sellerId);
    }
};
