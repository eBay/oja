'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');
const resolveFrom = require('resolve-from');
const resolvedSymbol = Symbol.for('oja@resolved');
const actionSymbol = Symbol.for('oja@action');
const locationSymbol = Symbol.for('oja@location');

let actionsMetaCache = {};
let duplicateActions = {};
const cwd = process.cwd();

function tryResolveFrom(from, name) {
    try {
        return resolveFrom(from, name);
    }
    catch (err) {
        const loc = tryResolve(name);
        if (loc) {
            return loc;
        }
        throw err;
    }
}

function safeResolveFrom(from, name) {
    try {
        return tryResolveFrom(from, name);
    }
    catch (err) {
        // skip
    }
}

/**
 * Resolves action for the given module root
 * @param {String} modRoot
 */
function resolveActions(modRoot, skipDeps) {
    let actions = actionsMetaCache[modRoot];
    if (!actions) {
        // load main actions of the module or app
        actions = loadActions(modRoot);

        // load actions from action dependencies
        const modules = getAllDependencyNames(modRoot);
        modules.forEach(name => {
            if (skipDeps && skipDeps.indexOf(name) !== -1) {
                return;
            }
            const modEntry = tryResolveFrom(modRoot, name);
            const modLocation = Path.resolve(modEntry, '..');
            const moduleActions = loadActions(modLocation);
            if (moduleActions) {
                actions = mergeActions(mergeActions({}, actions), moduleActions);
            }
        });

        // once we set it to cache, all actions for the root are resolved
        actionsMetaCache[modRoot] = actions;
    }

    // look at parent folder for other actions
    const modName = modRoot.split('/').pop();
    const parentDir = getParentModuleDir(modRoot);
    const parentRoot = parentDir && moduleRoot(parentDir);
    const parentActions = parentRoot &&
        resolveActions(parentRoot, [modName]) || [];

    if (Object.keys(parentActions).length) {
        actions = mergeActions(mergeActions({}, actions), parentActions);
    }

    return actions;
}

/**
 * Get parent root or undefined
 * @param {String} modRoot
 */
function getParentModuleDir(modRoot) {
    const parentDir = Path.dirname(modRoot);
    if (modRoot === parentDir ||
        cwd.length > parentDir.length) {
        return;
    }
    return parentDir;
}

/**
 * Find all unique actions matching namespace
 * @param {String} namespace
 * @param {Stirng} modRoot
 */
function resolveAllUniqueActions(namespace, modRoot, skipDeps) {
    return [...new Set(resolveAllActions(namespace, modRoot, skipDeps))];
}

/**
 * Find all actions including duplicate matching namespace
 * @param {String} namespace
 * @param {Stirng} modRoot
 */
function resolveAllActions(namespace, modRoot, skipDeps) {
    const allActions = [];
    const actions = resolveActions(modRoot, skipDeps);

    if (actions) {
        // eslint-disable-next-line no-shadow
        const appendActions = namespace => {
            const foundActions = Array.isArray(actions[namespace]) &&
            actions[namespace] || [actions[namespace]];
            allActions.push(...foundActions);
        };

        if (actions[namespace]) {
            appendActions(namespace);
        }
        else if (namespace === '*') {
            Object.keys(actions).forEach(ns => appendActions(ns));
        }
    }

    return allActions;
}

function resolveFirstAction(namespace, modRoot, skipDeps) {
    const actions = resolveActions(modRoot, skipDeps);
    if (actions && actions[namespace]) {
        if (Array.isArray(actions[namespace])) {
            return actions[namespace][0];
        }
        return actions[namespace];
    }
    const modName = modRoot.split('/').pop();
    const parentDir = getParentModuleDir(modRoot);
    // eslint-disable-next-line no-param-reassign
    modRoot = parentDir && moduleRoot(parentDir);
    return modRoot && resolveFirstAction(namespace,
        modRoot, [modName]) || undefined;
}

function matchAction(action, selectors = {}) {
    const actionMeta = action[actionSymbol];
    return !Object.keys(selectors).some(key => {
        const pureKey = /^~/.test(key) ? key.substring(1) : key;
        const sel = selectors[key];
        const val = actionMeta[pureKey];
        if (sel instanceof RegExp) {
            return !sel.test(val);
        }
        if (sel instanceof Function) {
            return !sel(val);
        }

        return sel !== val;
    });
}

function findAction(actions, selectors = {}) {
    if (actions.length === 0) {
        return;
    }
    for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        if (matchAction(action, selectors)) {
            return action;
        }
    }
    // remove one fallback selector
    const entries = Object.entries(selectors);
    for (let s = entries.length - 1; s >= 0; s--) {
        const key = entries[s][0];
        if (/^~/.test(key)) {
            const newSelectors = { ...selectors };
            delete newSelectors[key];
            // do a new search
            return findAction(actions, newSelectors);
        }
    }
}

function resolve(actionRequest, caller) {
    const { namespace, selectors } = actionRequest;
    const modRoot = moduleRoot(caller);
    // if selectors are present, then
    //   we need to collect all similar actions and selectors
    //   if not found, drop fallback selectors (prefixed with '~') one by one
    //      while re-running the search
    if (selectors) {
        const allActions = resolveAllUniqueActions(namespace, modRoot);
        // matching
        const act = findAction(allActions, selectors);
        return act;
    }
    // otherwise pick the first matching action
    return resolveFirstAction(namespace, modRoot);
}

const ctxActionsSymbol = Symbol.for('ctxActions');

function createLazyAction(resolveAction, config) {
    let act;
    return annotate((context = {}) => {
        const actionLocation = resolveAction();
        const ctaActions = context[ctxActionsSymbol] = context[ctxActionsSymbol] || {};
        let ctxAction = ctaActions[actionLocation];
        if (ctxAction === undefined) {
            // cache resolved action
            act = act || requireAction(actionLocation);
            // cache contextualized action
            ctxAction = ctaActions[actionLocation] = act(context, config);
        }
        return ctxAction;
    }, { [locationSymbol]: resolveAction });
    // we do not call lazyActionResolve here to avoid unnecessary work
}

function tryRequire(name) {
    if (String(process.env.VS_CODE_OJA_EXTENSION) === 'true') {
        const path = tryResolve(name);
        if (Fs.existsSync(path)) {
            const content = Fs.readFileSync(path).toString();
            return JSON.parse(content);
        }
        return;
    }
    // otherwise running in app
    try {
        return require(name);
    }
    catch (err) {
        // skip
    }
}

function compareActions(actionA, actionB) {
    try {
        Assert.deepEqual(actionA[actionSymbol], actionB[actionSymbol]);
        return true;
    }
    catch (err) {
        return false;
    }
}

/**
 * Merge actions, where duplicate actions (they may have different metadata)
 *  will be aggregated into an array by namespace
 * @param {*} dest
 * @param {*} src
 */
function mergeActions(registry = {}, actions) {
    actions && Object.keys(actions).forEach(key => {
        if (registry[key]) {
            let existingActions = registry[key];
            const actionsToAdd = Array.isArray(actions[key]) ? actions[key] : [actions[key]];
            // first check duplicate action (exact match or similar with the same namespace and metadata)
            existingActions = Array.isArray(existingActions) ? existingActions : [existingActions];
            const dupActions = [];
            const collisionActionLocations = [];
            // remove same ones before adding
            actionsToAdd.filter(action =>
                // check if action not
                !existingActions.some(existingAction => {
                    const existingKey = existingAction[
                        Symbol.for('oja@action')][Symbol.for('oja@key')];

                    // exclude same actions based on key
                    if (existingKey && existingKey ===
                    action[Symbol.for('oja@action')][Symbol.for('oja@key')]) {
                        return true;
                    }

                    if (compareActions(existingAction, action)) {
                        // remember conflict
                        collisionActionLocations.push(existingAction[actionSymbol][locationSymbol]());
                        dupActions.push(action[actionSymbol][locationSymbol]());
                        if (!duplicateActions[key]) {
                            duplicateActions[key] = [];
                            duplicateActions[key].push(existingAction);
                        }
                        if (!duplicateActions[key].find(act =>
                            compareActionsKeys(act, action))) {
                            duplicateActions[key].push(action);
                        }
                    }

                    return false;
                })
            ).forEach(action => {
                // merge the action
                if (!Array.isArray(registry[key])) {
                    const existing = registry[key];
                    registry[key] = [existing];
                }
                registry[key].push(action);
            });

            if (collisionActionLocations.length) {
                console.warn(`Found duplicate action "${key}"` +
                `, existing actions: "${collisionActionLocations.join(', ')}"` +
                `, action discovered "${dupActions.join(', ')}"`);
            }
        }
        else {
            registry[key] = actions[key];
        }
    });
    return registry;
}

function compareActionsKeys(a, b) {
    return a[Symbol.for('oja@action')][Symbol.for('oja@key')] ===
        b[Symbol.for('oja@action')][Symbol.for('oja@key')];
}

function annotate(obj, ...meta) {
    obj[actionSymbol] = obj[actionSymbol] || {};
    Object.assign(obj[actionSymbol], ...meta);
    return obj;
}

function requireAction(name) {
    try {
        return require(name);
    }
    catch (err) {
        throw new Error(`Failed to load action ${name}, reason: ${err.stack}`);
    }
}

function lazyActionResolve(name, parent) {
    let modRef; // caching
    return () => {
        if (modRef) {
            return modRef;
        }
        const location = parent && Path.resolve(parent, name);
        const loc = parent && (tryResolve(location) || safeResolveFrom(parent, name)) ||
            !parent && tryResolve(name);

        if (loc && !(loc instanceof Error)) {
            modRef = loc.toString();
            return modRef;
        }
        throw new Error(`Cannot locate action at ${location || name}`);
    };
}

function resolveActionLocation(name, parent) {
    return lazyActionResolve(name, parent)();
}

function tryResolve(name) {
    try {
        return require.resolve(name);
    }
    catch (err) {
        // skip
    }
}

/**
 * Loads actions defined in action.json file at the dir or module root
 * @param {*} dirOrModule
 */
function loadActions(dirOrModule) {
    // load actions if found
    const actionJsonPath = Path.join(dirOrModule, 'action.json');
    const actions = tryRequire(actionJsonPath);

    if (actions) {
        if (actions[resolvedSymbol]) {
            return actions;
        }
        const pkg = getRootPackage(dirOrModule);
        // if we have an action.json file with the list of locations
        if (Array.isArray(actions)) {
            // location data
            return actions.reduce((memo, location) => {
                const actionLocation = Path.resolve(dirOrModule, location);
                if (Fs.existsSync(Path.resolve(actionLocation, 'action.json'))) {
                    memo = mergeActions(memo,
                        loadActions(actionLocation));
                }
                // also check if it is a commons folder for all nested actions
                const names = Fs.readdirSync(actionLocation);
                names.forEach(name => {
                    const actLocation = Path.resolve(actionLocation, name);
                    if (Fs.statSync(actLocation).isDirectory()) {
                        memo = mergeActions(memo,
                            loadActions(actLocation));
                    }
                });
                return memo;
            }, {});
        }
        // get namespaces and action keys
        Object.keys(actions).forEach(ns => {
            const actionGroup = actions[ns];
            // prepare common metadata
            const actionMeta = { 'module': pkg.name, version: pkg.version, namespace: ns };
            if (typeof actionGroup === 'object') {
                if (actionGroup.function) {
                    // then it is an action metadata, so merge it
                    Object.assign(actionMeta, actionGroup);
                }
                else {
                    // this can be a group of simple actions or actions with metadata or a mix
                    Object.keys(actionGroup).forEach(actionName => {
                        const namespace = `${ns}/${actionName}`;
                        const actionInfo = actionGroup[actionName];
                        // got simple action location or action metadata
                        const isSingleAction = typeof actionInfo === 'string';
                        const actionLocation = isSingleAction ?
                            lazyActionResolve(actionInfo, dirOrModule) :
                            lazyActionResolve(actionInfo.function, dirOrModule);
                        // attach all matadata to action function
                        const action = annotate(createLazyAction(actionLocation, actionInfo),
                            Object.assign({},
                                actionMeta,
                                { namespace, [Symbol.for('oja@key')]:
                                    [dirOrModule, actionInfo.function || actionInfo].join(':') },
                                (isSingleAction ? null : actionInfo)
                            ));

                        // we are flattening the actions by complete namespace
                        actions[namespace] = action;
                        // remove flattened action branch
                        delete actionGroup[actionName];
                    });

                    // remove flattened group
                    delete actions[ns];
                    return;
                }
            }
            // otherwise a simple action location
            const actionLocation = lazyActionResolve(actions[ns].function || actions[ns], dirOrModule);
            actions[ns] = annotate(
                createLazyAction(actionLocation, actionMeta),
                actionMeta,
                { [Symbol.for('oja@key')]: [dirOrModule, actions[ns].function || actions[ns]].join(':') }
            );
        });

        // check any folder for nested actions
        processNestedActions(actions);

        // avoid resolving data next time
        actions[resolvedSymbol] = true;
        return actions;
    }
    // at least try to find nested actions
    return processNestedActions();

    // eslint-disable-next-line no-shadow
    function processNestedActions(actions) {
        Fs.readdirSync(dirOrModule).forEach(name => {
            const dirPath = Path.resolve(dirOrModule, name);
            if (Fs.statSync(dirPath).isDirectory &&
            Fs.existsSync(Path.resolve(dirPath, 'action.json'))) {
                const nestedActions = loadActions(dirPath);
                // eslint-disable-next-line no-param-reassign
                actions = actions || {};
                mergeActions(actions, nestedActions);
            }
        });
        return actions;
    }
}

const moduleRoots = [];
function findModuleRoot(currPath) {
    const appRoot = process.cwd();

    const pkgPath = Path.resolve(currPath, 'package.json');
    if (Fs.existsSync(pkgPath)) {
        return currPath;
    }

    const parentPath = Path.dirname(currPath);
    if (parentPath === currPath || parentPath === '/' || parentPath === appRoot) {
        return appRoot;
    }

    return findModuleRoot(parentPath);
}

function moduleRoot(path) {
    if (moduleRoots[path] !== undefined) {
        return moduleRoots[path];
    }
    const pkg = findModuleRoot(path);
    moduleRoots[path] = pkg;
    return pkg;
}

function getRootPackage(location) {
    const root = moduleRoot(location);
    return tryRequire(Path.resolve(root, 'package.json'));
}

function getAllDependencyNames(root) {
    const pkg = tryRequire(Path.resolve(root, 'package.json')) || {};
    const set = new Set([
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        ...Object.keys(pkg.devDependencies || {})
    ]);

    return [...set.keys()];
}

function getDuplicateActions() {
    return duplicateActions;
}

module.exports = {
    compareActions,
    matchAction,
    findAction,
    loadActions,
    resolveAllUniqueActions,
    resolveAllActions,
    resolveFirstAction,
    resolve,
    resolveActions,
    resolveActionLocation,
    moduleRoot,
    getAllDependencyNames,
    requireAction,
    lazyActionResolve,
    createLazyAction,
    getRootPackage,
    annotate,
    mergeActions,
    getDuplicateActions,
    get cache() {
        return actionsMetaCache;
    },
    /**
     * we want to reuse cache reset for vscode
     */
    resetCache() {
        actionsMetaCache = {};
        duplicateActions = {};
    }
};
