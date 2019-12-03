'use strict';

/**
 * Action: render
 * Domain: renderers
 */
module.exports = context => async ({ template, model }) => {
    // the one time we access http specific atrifacts like response
    context.response.setHeader('Content-Type', 'text/html; charset=utf-8');

    // here we still use flow which is convinient to control marko template data rendering
    template.render(model, context.response);

    // wait till we done in case one needs to know the moment
    // usually in unit tests
    return new Promise(resolve => {
        context.response.once('finish', () => resolve());
    });
};