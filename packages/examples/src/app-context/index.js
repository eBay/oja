'use strict';

const { createContext } = require('@ebay/oja-action');

module.exports.createExpressHandler = pageActionName => {
    return async function expressContextHandler(request, response, next) {
        try {
            const context = await createContext({
                // putting them here for edge cases, though we should avoid talking to these objects directly
                properties: {
                    request,
                    response
                },
                selectors: {
                    '~env': 'production'
                }
            });

            // page action
            const { model, template } = await context.action(`CONTROLLERS/${pageActionName}`);
            // render the results and wait till it is done
            // let someone detect the end of response
            // useful in tests            
            return await context.action('RENDERERS/render', {template, model});
        }
        catch (err) {
            next(err);
            // let someone know about failure
            // again mostly tests
            return Promise.reject(err);
        }
    }
}