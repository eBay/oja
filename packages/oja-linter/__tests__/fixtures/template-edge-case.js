'use strict';

module.exports = context => async parameters => {
    await context.action(`CONTROLLERS/${actionName}`);
};
