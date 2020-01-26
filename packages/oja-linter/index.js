'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

const Path = require('path');
const Fs = require('fs');
const esprima = require('esprima');
const { createContext } = require('@ebay/oja-action');

function select(json = {}, path) {
    let current = json;
    const keys = path.split('.');
    for (let i = 0; i < keys.length; i++) {
        current = current[keys[i]];
        if (current === undefined) {
            return;
        }
    }
    return current;
}

function parse(code) {
    code = `exports=${code}`;
    return esprima.parseScript(code, {
        loc: true,
        comment: true
    });
}

function loadActionStatements(path) {
    const code = Fs.readFileSync(path).toString();
    const ast = parse(code);
    return findActionStatements(ast);
}

function findActionStatements(ast) {
    const comments = ast.comments || [];
    return findStatements(ast);

    // eslint-disable-next-line no-shadow
    function findStatements(ast) {
        if (!ast || typeof ast !== 'object' && !Array.isArray(ast)) {
            return [];
        }
        const stmts = [];

        ast = Array.isArray(ast) && ast || [ast];
        ast.forEach(itm => {
            if (!itm) {
                return;
            }
            if (itm.type === 'CallExpression' &&
            select(itm, 'callee.type') === 'MemberExpression' &&
            select(itm, 'callee.object.type') === 'Identifier' &&
            select(itm, 'callee.object.name') === 'context' &&
            select(itm, 'callee.property.type') === 'Identifier' &&
            select(itm, 'callee.property.name') === 'action') {
                const [namespace, ...parameters] = itm.arguments;
                const stmt = {
                    namespace,
                    parameters
                };
                const commentCommand = getCommentCommand(itm.loc.start.line - 1);
                if (commentCommand) {
                    stmt.commentCommand = commentCommand;
                }
                stmts.push(stmt);
            }
            // drill down
            Object.keys(itm).forEach(key => {
                const foundStmts = findStatements(itm[key]);
                stmts.push(...foundStmts);
            });
        });
        return stmts;
    }

    function getCommentCommand(line) {
        for (let index = 0; index < comments.length; index++) {
            const comment = comments[index];
            const start = comment.loc.start;
            if (start.line === line) {
                if (/oja-lint-disable-next-line\s+no-warn/.test(comment.value)) {
                    return {
                        'no-warn': true
                    };
                }
                if (/oja-lint-disable-next-line\s+no-error/.test(comment.value)) {
                    return {
                        'no-error': true
                    };
                }
                return;
            }
        }
    }
}

function getNamespace(stmt) {
    const namespace = stmt.namespace;
    if (namespace.type === 'ObjectExpression') {
        return findName(namespace.properties);
    }
    return namespace;
}

function findName(properties) {
    const prop = properties.filter(prp => prp.key.name === 'name')[0];
    if (prop) {
        return prop.value;
    }
}

/**
 * Create validator per project root folder
 */
async function createValidator() {
    const errors = [];
    const context = await createContext();
    // return check function that will accumulate errors
    return async path => {
        try {
            return await validate(path);
        }
        catch (err) {
            errors.push({
                message: err.message,
                path,
                code: 'unexpected',
                codeType: 'error'
            });
            return errors;
        }
    };

    async function validate(path) {
        if (!path) {
            return errors;
        }
        if (/action.json$/.test(path)) {
            // piggyback on esprima parse as it generates code locations
            // which we need to handle linting
            // hence, convert it to valid js code before parsing
            return await validateActionFile(path);
        }
        const code = Fs.readFileSync(path).toString();
        let ast;
        try {
            ast = parse(code);
        }
        catch (err) {
            errors.push({
                message: err.message,
                path,
                code: 'parse',
                codeType: 'error'
            });
            return errors;
        }
        const stmts = findActionStatements(ast);
        for (let index = 0; index < stmts.length; index++) {
            const stmt = stmts[index];
            const namespace = getNamespace(stmt);
            if (namespace.value) {
                const action = await context.proxyAction(
                    path, 'oja/resolveFirstAction', namespace.value, path);
                if (!action) {
                    if (stmt.commentCommand && stmt.commentCommand['no-error']) {
                        continue;
                    }

                    errors.push({
                        path,
                        namespace,
                        code: 'notFound',
                        codeType: 'error'
                    });

                    continue;
                }
                const actionLocation = tryActionLocation(action[Symbol.for('oja@action')]
                    [Symbol.for('oja@location')]);

                if (actionLocation instanceof Error) {
                    errors.push({
                        path,
                        namespace,
                        message: actionLocation.message,
                        code: 'codeNotFound',
                        codeType: 'error'
                    });
                    continue;
                }

                if (actionLocation === path) {
                    if (stmt.commentCommand && stmt.commentCommand['no-warn']) {
                        continue;
                    }

                    errors.push({
                        path,
                        namespace,
                        code: 'circular',
                        codeType: 'warn'
                    });
                }
            }
        }

        return errors;
    }

    function tryActionLocation(loc) {
        try {
            return loc();
        }
        catch (err) {
            // skip
            return err;
        }
    }

    async function validateActionFile(actionPath) {
        let actions;
        try {
            actions = parseAction(actionPath);
        }
        catch (err) {
            errors.push({
                path: actionPath,
                message: `Failed to parse action file ${actionPath}, error: ${err.message}`,
                codeType: 'error',
                code: 'parseError'
            });
            return errors;
        }
        for (let i = 0; i < actions.length; i++) {
            const { namespace, value } = actions[i];

            try {
                await context.proxyAction(actionPath,
                    'oja/action', 'resolveActionLocation', value.value,
                    Path.resolve(actionPath, '..'));
            }
            catch (err) {
                errors.push({
                    path: actionPath,
                    namespace,
                    'function': value,
                    message: err.message,
                    codeType: 'error',
                    code: 'functionNotFound'
                });
            }
        }
        return errors;
    }
}

function adjustLoc(itm, line, offsetColumn) {
    if (itm.loc.start.line === line) {
        itm.loc.start.column += offsetColumn;
    }
    if (itm.loc.end.line === line) {
        itm.loc.end.column += offsetColumn;
    }
}

function parseAction(path) {
    const ast = parse(Fs.readFileSync(path).toString());
    return findActionFunctions(ast);
}

function findActionFunctions(ast) {
    const actions = [];

    const actionDefs = select(ast, 'body.0.expression.right.properties');
    if (!actionDefs) {
        return actions;
    }

    for (let i = 0; i < actionDefs.length; i++) {
        const def = actionDefs[i];
        const namespace = def.key;
        if (namespace) {
            adjustLoc(namespace, 1, -8);
            const value = select(def, 'value');
            if (def.value) {
                if (def.value.type === 'Literal') {
                    adjustLoc(value, 1, -8);
                    actions.push({
                        namespace,
                        value
                    });
                    continue;
                }
                // check complex structure
                if (def.value.type === 'ObjectExpression') {
                    const func = value.properties.find(
                        prop => prop.key.value === 'function');

                    adjustLoc(func.value, 1, -8);

                    actions.push({
                        namespace,
                        value: func.value
                    });
                    continue;
                }
            }
        }
    }

    return actions;
}

async function getAllActions(path) {
    const context = await createContext();
    const actions = await context.proxyAction(path,
        'oja/resolveAllActions', '*', path);

    return actions.map(action => {
        const actionMeta = action[Symbol.for('oja@action')];
        return {
            namespace: actionMeta.namespace,
            location: actionMeta
                [Symbol.for('oja@location')]()
        };
    });
}

function loadIgnoreList(cwd) {
    const lintignore = Path.resolve(cwd, '.ojalintignore');
    if (Fs.existsSync(lintignore)) {
        const content = Fs.readFileSync(lintignore).toString();
        const lines = content.split(/[\r\n]+/);
        return lines.reduce((memo, line) => {
            // eslint-disable-next-line no-param-reassign
            line = line.trim();
            if (line) {
                // eslint-disable-next-line no-param-reassign
                line = line.replace(/\*/g, '.*');
                memo.push(new RegExp(line));
            }
            return memo;
        }, []);
    }
    return [
        /node_modules/
    ];
}

async function collectDuplicateActionErrors(path) {
    const errors = [];
    const context = await createContext();
    const dups = await context.proxyAction(path, 'oja/action', 'getDuplicateActions');
    Object.keys(dups).map(ns => {
        const dupActions = dups[ns];
        errors.push({
            files: dupActions.map(action =>
                action[Symbol.for('oja@action')][Symbol.for('oja@location')]()),
            namespace: ns,
            code: 'duplicate',
            codeType: 'warn'
        });
    });
    return errors;
}

async function lint(cwd) {
    const ignoreList = loadIgnoreList(cwd);
    const validate = await createValidator();
    await lintNextDir(cwd);

    // get final errors object
    const errors = await validate();
    const dupErrors = await collectDuplicateActionErrors(cwd);
    return [...errors, ...dupErrors];

    async function lintNextDir(path) {
        const items = Fs.readdirSync(path);
        const results = items.map(async itm => {
            if (ignoreList.some(pattern => pattern.test(itm))) {
                return;
            }
            const file = Path.resolve(path, itm);
            const stat = Fs.statSync(file);
            if (stat.isDirectory()) {
                return await lintNextDir(file);
            }
            if (/\.(js|mjs)$/.test(file)) {
                return await validate(file);
            }
            if (/action\.json$/.test(file)) {
                return await validate(file, true);
            }
        });
        await Promise.all(results);
    }
}

function selectErrorMessage(error) {
    const start = select(error, 'namespace.loc.start');
    switch (error.code) {
        case 'duplicate':
            return `duplicate action "${error.namespace}" detected, files:${
                error.files.join(',\n')}`;
        case 'circular':
            return `circular call of "${
                error.namespace.value}" action: ${
                error.path}:${start.line},${start.column}`;
        case 'unexpected':
            return `unexpected error, fail to parse "${
                error.path}" ${error.message}, please report to the linter owners`;
        case 'parse':
            return `fail to parse "${
                error.path}" ${error.message}`;
        default:
            return `action "${
                error.namespace.value}" not found: ${
                error.path}:${start.line},${start.column}`;
    }
}

/**
 * Scans js/mjs file starting from project folder
 *  for any invalid action
 * @param {*} cwd - project root
 */
async function scan(cwd, exitOnFinish) {
    const errors = await lint(cwd);
    let errorCount = 0;
    errors.forEach(err => {
        const errorMessage = selectErrorMessage(err);
        if (err.codeType === 'error') {
            errorCount++;
        }
        // eslint-disable-next-line no-console
        console[err.codeType](`${err.codeType}: ${
            errorMessage}${err.message ? `,\n\toriginal error: ${err.message}` : ''}`);
    });

    if (exitOnFinish) {
        if (errorCount > 0) {
            console.error(`Total errors: ${errorCount}`);
            process.exit(1);
            return;
        }
        process.exit(0);
        return;
    }

    return [errors, errorCount];
}

module.exports = {
    findActionFunctions,
    findActionStatements,
    loadActionStatements, // used by vscode
    collectDuplicateActionErrors,
    parseAction,
    parse,
    scan,
    lint,
    getAllActions,
    createValidator
};
