'use strict';

const Assert = require('assert');
const createContext = require('src/app-context');

describe(__filename, () => {
    test('action capture should fail', async() => {
        const context = await createContext({
            functions: {
                'RENDERERS/render': new Error('BOOM')
            }
        });
        try {
            await context.action('RENDERERS/render');
        } catch (err) {
            Assert.equal('BOOM', err.message);
        }
    });

    test('action capture should be called', async() => {
        const context = await createContext({
            selectors: {
                env: 'test'
            }
        });
        const response = await context.action('RENDERERS/render', {
            template: {
                render(model, output) {
                    output.write('ok');
                    output.write('ok');
                    output.end();
                }
            }
        });
        Assert.equal('okok', response.body);
    });
});