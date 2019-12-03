'use strict';

module.exports = {
    helpers: {
        domain: name => {
            const parts = name.split('/');
            parts.pop();
            return parts.join('/') || 'default';
        },
        actionName: name => {
            const parts = name.split('/');
            return parts.pop();
        }
    }
}