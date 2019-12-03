'use strict';

const Shell = require('shelljs');

module.exports = {
    runCmd(cmd) {
        console.info('Running cmd:', cmd);
        const ret = Shell.exec(cmd);
        if (ret.code !== 0) {
            console.info(ret.stdout);
            console.error(ret.stderr);
            throw new Error(`command ${cmd} failed`);
        }
        return ret;
    }
};