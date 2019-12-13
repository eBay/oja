'use strict';

module.exports = (context, config, runtime) => {
    return `${config && config.operation}-${runtime[Symbol.for('oja@callerLocation')]}`;
};
