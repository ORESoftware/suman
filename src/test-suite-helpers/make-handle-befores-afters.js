'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const domain = require("domain");
const util = require("util");
const suman_utils_1 = require("suman-utils");
const chalk = require("chalk");
const _suman = global.__suman = (global.__suman || {});
const make_fini_callbacks_1 = require("./make-fini-callbacks");
const helpers = require("./handle-promise-generator");
const { constants } = require('../../config/suman-constants');
const general_1 = require("../helpers/general");
const all_hook_param_1 = require("../test-suite-params/all-hook/all-hook-param");
exports.makeHandleBeforesAndAfters = function (suman, gracefulExit) {
    return function handleBeforesAndAfters(self, aBeforeOrAfter, cb, retryData) {
        if (_suman.uncaughtExceptionTriggered) {
            _suman.log.error(`runtime error => "UncaughtException already occurred" => halting program in file:\n[${__filename}]`);
            return;
        }
        aBeforeOrAfter.alreadyInitiated = true;
        const timerObj = {
            timer: null
        };
        const assertCount = {
            num: 0
        };
        const d = domain.create();
        d.sumanAllHook = true;
        d.sumanAllHookName = aBeforeOrAfter.desc || '(unknown all-hook name)';
        const fini = make_fini_callbacks_1.makeAllHookCallback(d, assertCount, aBeforeOrAfter, timerObj, gracefulExit, cb);
        const fnStr = aBeforeOrAfter.fn.toString();
        if (suman.config.retriesEnabled === true && Number.isInteger(aBeforeOrAfter.retries)) {
            fini.retryFn = retryData ? retryData.retryFn : handleBeforesAndAfters.bind(null, ...Array.from(arguments));
        }
        let dError = false;
        const handleError = (err) => {
            if (aBeforeOrAfter.dynamicallySkipped === true) {
                return fini(null);
            }
            if (fini.retryFn) {
                if (!retryData) {
                    return fini.retryFn({ retryFn: fini.retryFn, retryCount: 1, maxRetries: aBeforeOrAfter.retries });
                }
                else if (retryData.retryCount < aBeforeOrAfter.retries) {
                    retryData.retryCount++;
                    return fini.retryFn(retryData);
                }
                else {
                    _suman.log.error('maximum retries attempted.');
                }
            }
            const errMessage = err && (err.stack || err.message || util.inspect(err));
            err = general_1.cloneError(aBeforeOrAfter.warningErr, errMessage, false);
            const stk = err.stack || err;
            const formatedStk = typeof stk === 'string' ? stk : util.inspect(stk);
            if (!dError) {
                dError = true;
                clearTimeout(timerObj.timer);
                if (aBeforeOrAfter.fatal === false) {
                    _suman.writeTestError(' => Suman non-fatal error => Normally fatal error in hook, but "fatal" option for the hook ' +
                        'is set to false => \n' + formatedStk);
                    fini(null);
                }
                else {
                    gracefulExit({
                        sumanFatal: true,
                        sumanExitCode: constants.EXIT_CODES.FATAL_HOOK_ERROR,
                        stack: 'Fatal error in hook => (to continue even in the event of an error ' +
                            'in a hook use option {fatal:false}) => ' + '\n' + formatedStk
                    });
                }
            }
            else {
                _suman.writeTestError(' => Suman error => Error in hook => \n' + formatedStk);
            }
        };
        d.on('error', handleError);
        process.nextTick(() => {
            const { sumanOpts } = _suman;
            if (sumanOpts.debug_hooks) {
                _suman.log.info(`now running all hook with name '${chalk.yellow(aBeforeOrAfter.desc)}'.`);
            }
            d.run(function runAllHook() {
                _suman.activeDomain = d;
                let warn = false;
                if (fnStr.indexOf('Promise') > 0 || fnStr.indexOf('async') === 0) {
                    warn = true;
                }
                const h = new all_hook_param_1.AllHookParam(aBeforeOrAfter, assertCount, handleError, fini, timerObj);
                h.__shared = self.shared;
                h.supply = self.supply;
                h.block = self;
                h.desc = aBeforeOrAfter.desc;
                fini.thot = h;
                if (suman_utils_1.default.isGeneratorFn(aBeforeOrAfter.fn)) {
                    const handle = helpers.handleReturnVal(h.handlePossibleError.bind(h), fnStr, aBeforeOrAfter);
                    handle(helpers.handleGenerator(aBeforeOrAfter.fn, h));
                }
                else if (aBeforeOrAfter.cb) {
                    h.callbackMode = true;
                    const dne = (err) => {
                        h.handlePossibleError(err);
                    };
                    h.done = dne;
                    h.ctn = h.pass = function (ignoredError) {
                        fini(null);
                    };
                    let arg = Object.setPrototypeOf(dne, h);
                    if (aBeforeOrAfter.fn.call(null, arg)) {
                        _suman.writeTestError(general_1.cloneError(aBeforeOrAfter.warningErr, constants.warnings.RETURNED_VAL_DESPITE_CALLBACK_MODE, true).stack);
                    }
                }
                else {
                    const handle = helpers.handleReturnVal(h.handlePossibleError.bind(h), fnStr, aBeforeOrAfter);
                    handle(aBeforeOrAfter.fn.call(null, h), warn);
                }
            });
        });
    };
};
