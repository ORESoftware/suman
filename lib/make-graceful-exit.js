'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const util = require("util");
const EE = require("events");
const async = require("async");
const chalk = require("chalk");
const flattenDeep = require('lodash.flattendeep');
const su = require("suman-utils");
const _suman = global.__suman = (global.__suman || {});
const { runAfterAlways } = require('./helpers/run-after-always');
const { constants } = require('../config/suman-constants');
const singleProc = process.env.SUMAN_SINGLE_PROCESS === 'yes';
const general_1 = require("./helpers/general");
const suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
const debug = require('suman-debug')('s:graceful-exit');
const testErrors = _suman.testErrors = _suman.testErrors || [];
const sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
exports.makeGracefulExit = function (suman) {
    return function runGracefulExitOrNot($errs, cb) {
        const { sumanOpts } = _suman;
        const fst = sumanOpts.full_stack_traces;
        if (cb && typeof cb !== 'function') {
            throw new Error('Suman implementation error - callback was not passed to gracefulExit, please report.');
        }
        let highestExitCode = 0;
        let exitTestSuite = false;
        let errs = flattenDeep([$errs]).filter((e) => e);
        if (_suman.uncaughtExceptionTriggered) {
            _suman.log.error('"uncaughtException" event occurred => halting program.');
            if (errs.length) {
                errs.filter(e => e).forEach(function (e) {
                    _suman.log.error(chalk.red('Most likely unrelated error => Graceful exit error => \n') + su.getCleanErrorString(e));
                });
            }
            _suman.log.error('reached graceful exit, but "uncaughtExceptionTriggered" was already true.');
            return cb && process.nextTick(cb);
        }
        const big = errs.filter(function (err) {
            if (err && err.isFromTest && !sumanOpts.bail) {
                if (su.vgt(7)) {
                    _suman.log.warning('The following error will be ignored because it was a test case error and bail is not true.');
                    _suman.log.warning(err.stack || util.inspect(err));
                }
                return false;
            }
            else if (err && err.sumanFatal === false) {
                _suman.log.warning('The following error will be ignored because "sumanFatal" was set to false.');
                _suman.log.warning(err.stack || util.inspect(err));
                return false;
            }
            else if (err) {
                return true;
            }
            else {
                if (su.vgt(5)) {
                    _suman.log.warning('An error will be ignored because it is falsy:');
                    _suman.log.warning(util.inspect(err));
                }
                return false;
            }
        })
            .map(function (err) {
            let sumanFatal = err.sumanFatal;
            let exitCode = err.sumanExitCode;
            if (exitCode) {
                console.error('\n');
                _suman.log.error('positive exit code with value', exitCode);
            }
            if (exitCode > highestExitCode) {
                highestExitCode = exitCode;
            }
            let stack = su.getCleanErrStr(err).split('\n').filter(function (item, index) {
                if (fst) {
                    return true;
                }
                if (index < 2) {
                    return true;
                }
                if (!String(item).match(/\/node_modules\//) &&
                    !String(item).match(/next_tick.js/)) {
                    return true;
                }
            });
            stack[0] = chalk.bold(stack[0]);
            return stack.join('\n').concat('\n');
        })
            .map(function (err) {
            exitTestSuite = true;
            sumanRuntimeErrors.push(err);
            const isBail = sumanOpts.bail ? '(note that the "--bail" option set to true)\n' : '';
            const str = '\n⚑ ' + chalk.bgRed.white.bold(' Suman fatal error ' + isBail +
                ' => making a graceful exit => ') + '\n' + chalk.red(String(err)) + '\n\n';
            const padded = str.split('\n').map(function (s) {
                return su.padWithXSpaces(3) + s;
            });
            const s = padded.join('\n');
            console.log('\n');
            _suman.log.error('SUMAN ERROR:', s);
            return s;
        });
        if (singleProc && exitTestSuite) {
            _suman.log.error('Suman single process and runtime uncaught exception or error in hook experienced.');
            suiteResultEmitter.emit('suman-test-file-complete');
        }
        else if (exitTestSuite) {
            if (!suman.sumanCompleted) {
                async.parallel([
                    function (cb) {
                        const joined = big.join('\n');
                        general_1.fatalRequestReply({
                            type: constants.runner_message_type.FATAL,
                            data: {
                                msg: joined,
                                error: joined
                            }
                        }, cb);
                    },
                    function (cb) {
                        runAfterAlways(suman, cb);
                    }
                ], function () {
                    suman.logFinished(highestExitCode || 1, null, function (err, val) {
                        err && _suman.log.error(su.getCleanErrorString(err));
                        process.exit(highestExitCode || 1);
                    });
                });
            }
        }
        else {
            if (cb) {
                process.nextTick(cb);
            }
            else {
                _suman.log.error('Suman implementation warning: no callback passed to graceful-exit routine.');
            }
        }
    };
};
