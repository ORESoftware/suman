'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const path = require("path");
const assert = require("assert");
const chalk = require("chalk");
const su = require("suman-utils");
const _suman = global.__suman = (global.__suman || {});
const weAreDebugging = su.weAreDebugging;
const suman_constants_1 = require("../../config/suman-constants");
const { acquirePreDeps } = require('../acquire-dependencies/acquire-pre-deps');
if (!('integrantHashKeyVals' in _suman)) {
    Object.defineProperty(_suman, 'integrantHashKeyVals', {
        writable: false,
        value: {}
    });
}
exports.makeHandleIntegrantInfo = function (runnerObj, allOncePostKeys, integrantHashKeyVals) {
    const INTEGRANT_INFO = suman_constants_1.constants.runner_message_type.INTEGRANT_INFO;
    return function handleIntegrantInfo(msg, n, s) {
        const oncePostKeys = msg.oncePost;
        if (Number.isInteger(msg.expectedExitCode)) {
            n.expectedExitCode = msg.expectedExitCode;
        }
        else if (msg.expectedExitCode !== undefined) {
            throw new Error(' => Suman implementation error => expected exit code not an integer ' +
                'for child process => ' + n.testPath);
        }
        if (Number.isInteger(msg.expectedTimeout)) {
            if (!weAreDebugging) {
                clearTimeout(n.to);
                n.to = setTimeout(function () {
                    n.kill();
                }, msg.expectedTimeout);
            }
        }
        else if (msg.expectedTimeout !== undefined) {
            throw new Error(' => Suman implementation error => expected timeout not an acceptable integer ' +
                'for child process => ' + n.testPath);
        }
        assert(Array.isArray(oncePostKeys), 'oncePostKeys is not an array type.');
        allOncePostKeys.push(oncePostKeys);
        s.emit(INTEGRANT_INFO, {
            info: 'once-post-received'
        });
        if (oncePostKeys.length > 0 && !runnerObj.innited) {
            try {
                runnerObj.innited = true;
                let oncePostModule = runnerObj.oncePostModule = require(path.resolve(_suman.sumanHelperDirRoot + '/suman.once.post.js'));
                assert(typeof oncePostModule === 'function', 'suman.once.post.js module does not export a function.');
                runnerObj.hasOncePostFile = true;
            }
            catch (err) {
                _suman.log.error(chalk.red('Suman usage warning => you have suman.once.post data defined, ' +
                    'but no suman.once.post.js file.') + '\n' + su.getCleanErrorString(err));
            }
        }
        const integrants = msg.msg;
        assert(Array.isArray(integrants), 'integrants must be an array.');
        const depContainerObj = runnerObj.depContainerObj;
        if (!depContainerObj) {
            throw new Error('suman implementation error, missing definition.');
        }
        return acquirePreDeps(integrants, depContainerObj).then(function (val) {
            let stringified;
            try {
                stringified = su.customStringify(val);
            }
            catch (err) {
                _suman.log.error(su.getCleanErrorString(err));
            }
            s.emit(INTEGRANT_INFO, { info: 'all-integrants-ready', val: stringified });
        }, function (err) {
            let strErr = su.getCleanErrorString(err);
            _suman.log.error(strErr);
            s.emit(INTEGRANT_INFO, { info: 'integrant-error', data: strErr });
        });
    };
};
