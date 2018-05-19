'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const _suman = global.__suman = (global.__suman || {});
const { constants } = require('../../config/suman-constants');
let values = null;
exports.getCoreAndDeps = function () {
    if (!values) {
        const p = new Proxy({}, {
            get: function (target, prop) {
                const trimmed = String(prop).trim();
                try {
                    return require(trimmed);
                }
                catch (err) { }
                const replaceLodashWithDash = trimmed.replace(/_/g, '-');
                if (replaceLodashWithDash !== trimmed) {
                    try {
                        return require(replaceLodashWithDash);
                    }
                    catch (err) { }
                    throw new Error(`could not require dependencies with names '${trimmed}' or '${replaceLodashWithDash}'.`);
                }
                throw new Error(`could not require dependency with name '${trimmed}'`);
            }
        });
        values = {
            $core: p,
            $deps: p,
            $require: p
        };
    }
    return values;
};
exports.getProjectModule = function () {
    try {
        return require(_suman.projectRoot);
    }
    catch (err) {
        _suman.log.error('\n', err.stack || err, '\n');
        return null;
    }
};
exports.lastDitchRequire = function (dep, requestorName) {
    requestorName = requestorName || '';
    try {
        return require(dep);
    }
    catch (err) {
        try {
            return require(String(dep).replace(/_/g, '-'));
        }
        catch (err) {
            _suman.log.error(`'${requestorName}' warning => cannot require dependency with name => '${dep}'.`);
            _suman.log.error('Despite the missing dependency, Suman will continue optimistically.');
            console.error('\n');
            return null;
        }
    }
};
