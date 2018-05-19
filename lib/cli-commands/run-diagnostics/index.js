'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const chalk = require("chalk");
const _suman = global.__suman = (global.__suman || {});
const { constants } = require('../../config/suman-constants');
exports.run = function (cb) {
    console.log(' => NODE_PATH => ', process.env.NODE_PATH);
    let deps = [];
    Object.keys(constants.SUMAN_GLOBAL_DEPS).forEach(function (k) {
        deps = deps.concat(constants.SUMAN_GLOBAL_DEPS[k]);
    });
    let reinstallThese = [];
    deps.forEach(function (obj) {
        Object.keys(obj).forEach(function (k) {
            let version = obj[k];
            let resolved = false;
            try {
                console.log('Attempting to require => ', k);
                require.resolve(k);
                resolved = true;
            }
            catch (err) {
                console.log(err.stack || err);
                if (resolved === false) {
                    let dep = {};
                    dep[k] = version;
                    reinstallThese.push(dep);
                }
            }
        });
    });
    console.log('\n');
    console.log(chalk.magenta(' => Suman diagnostics suggests the following deps need to be re-installed => '), '\n', reinstallThese);
    if (cb) {
        cb();
    }
    else {
        process.exit(0);
    }
};
