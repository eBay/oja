'use strict';

module.exports = context => {
    context.action('QAZ/qaz');
    // oja-lint-disable-next-line no-error
    context.action('BAD/bad');
    context.action('BAD2/bad');
};
