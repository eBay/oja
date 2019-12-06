'use strict';

// eslint-disable-next-line no-console
console.info('Bootstrapping oja modules');

const ojaActionLocation = require.resolve('../../../../../oja-action');
const ojaAction = require(ojaActionLocation);
const ojaContextLocation = require.resolve('../../../../../oja-context');
const ojaContext = require(ojaContextLocation);

const m = require('module');
const originalLoader = m._load;

m._load = function (name, meta) {
    if (/@ebay\/oja-action/.test(name)) {
        return ojaAction;
    }
    if (/^@ebay\/oja-context$/.test(name)) {
        return ojaContext;
    }

    return originalLoader.apply(m, arguments);
};

const _resolveFilename = m._resolveFilename
m._resolveFilename = function (name, parent, isMain) {
    if (/@ebay\/oja-action/.test(name)) {
        return ojaActionLocation;
    }
    if (/^@ebay\/oja-context$/.test(name)) {
        return ojaContextLocation;
    }
    return _resolveFilename.apply(m, arguments);
};
