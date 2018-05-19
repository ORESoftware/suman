'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const domain = require("domain");
const assert = require("assert");
const vamoot_1 = require("vamoot");
const McProxy = require("proxy-mcproxy");
const chalk = require("chalk");
const async = require("async");
const fnArgs = require('function-arguments');
const pragmatik = require('pragmatik');
const _suman = global.__suman = (global.__suman || {});
const rules = require("./helpers/handle-varargs");
const suman_constants_1 = require("../config/suman-constants");
const su = require("suman-utils");
const make_graceful_exit_1 = require("./make-graceful-exit");
const acquire_ioc_deps_1 = require("./acquire-dependencies/acquire-ioc-deps");
const test_suite_1 = require("./test-suite-helpers/test-suite");
const general_1 = require("./helpers/general");
const handle_injections_1 = require("./test-suite-helpers/handle-injections");
const general_2 = require("./helpers/general");
const general_3 = require("./helpers/general");
const general = require("./helpers/general");
const suman_methods_1 = require("./test-suite-helpers/suman-methods");
const make_handle_befores_afters_1 = require("./test-suite-helpers/make-handle-befores-afters");
const notify_parent_that_child_is_complete_1 = require("./test-suite-helpers/notify-parent-that-child-is-complete");
exports.execSuite = function (suman) {
    _suman.whichSuman = suman;
    const sumanConfig = suman.config;
    suman.dateSuiteStarted = Date.now();
    const onSumanCompleted = general_2.makeOnSumanCompleted(suman);
    const gracefulExit = make_graceful_exit_1.makeGracefulExit(suman);
    const handleBeforesAndAfters = make_handle_befores_afters_1.makeHandleBeforesAndAfters(suman, gracefulExit);
    const notifyParent = notify_parent_that_child_is_complete_1.makeNotifyParent(suman, gracefulExit, handleBeforesAndAfters);
    const createInjector = suman_methods_1.makeSumanMethods(suman, gracefulExit, handleBeforesAndAfters, notifyParent);
    const allDescribeBlocks = suman.allDescribeBlocks;
    return function runRootSuite($$desc, $$opts) {
        const sumanOpts = suman.opts;
        const isPreParsed = su.isObject($$opts) && $$opts.__preParsed;
        const args = pragmatik.parse(arguments, rules.createSignature, isPreParsed);
        const vetted = general.parseArgs(args);
        const [$desc, opts, cb] = vetted.args;
        const arrayDeps = vetted.arrayDeps;
        let iocDepNames;
        assert(opts.__preParsed, 'Suman implementation error. ' +
            'Options should be pre-parsed at this point in the program. Please report.');
        delete opts.__preParsed;
        if (arrayDeps && arrayDeps.length > 0) {
            iocDepNames = general_3.evalOptions(arrayDeps, opts);
        }
        else {
            iocDepNames = [];
        }
        if (opts.__toBeSourcedForIOC) {
            Object.keys(opts.__toBeSourcedForIOC).forEach(function (v) {
                iocDepNames.push(v);
            });
        }
        if (su.isObject(opts.inject)) {
            Object.keys(opts.inject).forEach(function (v) {
                iocDepNames.push(v);
            });
        }
        if (Array.isArray(opts.inject)) {
            opts.inject.forEach(function (v) {
                iocDepNames.push(v);
            });
        }
        const desc = ($desc === '[suman-placeholder]') ? suman.slicedFileName : $desc;
        suman.desc = desc;
        if (su.isGeneratorFn(cb) || su.isAsyncFn(cb)) {
            const msg = suman_constants_1.constants.ERROR_MESSAGES.INVALID_FUNCTION_TYPE_USAGE;
            return general_1.fatalRequestReply({
                type: suman_constants_1.constants.runner_message_type.FATAL,
                data: {
                    errors: [msg],
                    msg: msg
                }
            }, function () {
                console.error('\n');
                _suman.log.error(msg);
                let err = new Error('Suman usage error => invalid arrow/generator function usage.').stack;
                _suman.log.error(err);
                _suman.writeTestError(err);
                process.exit(suman_constants_1.constants.EXIT_CODES.INVALID_ARROW_FUNCTION_USAGE);
            });
        }
        const deps = suman.deps = fnArgs(cb);
        const delayOptionElected = opts.delay;
        suman.rootSuiteDescription = desc;
        if (!opts.only && _suman.describeOnlyIsTriggered) {
            _suman.writeTestError(' => Suite with description => "' + desc + '" was skipped because another test suite in this file\n' +
                'invoked the only option.');
            onSumanCompleted(0, ' => skipped due to "only" option invoked on another test suite');
            return;
        }
        if (opts.skip) {
            _suman.writeTestError(' => Suite with description => "' + desc + '" was skipped because because you\n' +
                'passed the "skip" option to the test suite.');
            onSumanCompleted(0, ' => skipped due to explicit call of "skip" option');
            return;
        }
        const suite = new test_suite_1.TestBlock({ desc, isTopLevel: true, opts, suman, gracefulExit, handleBeforesAndAfters, notifyParent });
        suite.bIsFirstArg = deps[0] === 'b';
        suite.isRootSuite = true;
        suite.bindExtras();
        allDescribeBlocks.push(suite);
        const v = suite.__supply = {};
        suite.supply = McProxy.create(v);
        try {
            assert(typeof _suman.globalHooksFn === 'function', '<suman.hooks.js> file must export a function.');
            _suman.globalHooksFn.call(null, suite);
        }
        catch (err) {
            _suman.log.error(chalk.yellow('warning: Could not load your "suman.hooks.js" file'));
            if (!/Cannot find module/i.test(err.message)) {
                throw err;
            }
        }
        if (deps.length < 1) {
            process.nextTick(startWholeShebang, null, []);
        }
        else {
            const d = domain.create();
            d.once('error', function (err) {
                console.error(err.stack || err);
                _suman.writeTestError(err.stack || err);
                d.exit();
                process.nextTick(function () {
                    err = new Error('Suman usage error => Error acquiring IOC deps => \n' + (err.stack || err));
                    err.sumanFatal = true;
                    err.sumanExitCode = suman_constants_1.constants.EXIT_CODES.IOC_DEPS_ACQUISITION_ERROR;
                    _suman.log.error(err.stack || err);
                    gracefulExit(err, null);
                });
            });
            d.run(function acquireIocDepsDomainRun() {
                acquire_ioc_deps_1.acquireIocDeps(suman, iocDepNames, suite, {}, function (err, iocDeps) {
                    if (err) {
                        _suman.log.error('Error acquiring IoC deps:', err.stack || err);
                        return process.exit(suman_constants_1.constants.EXIT_CODES.ERROR_ACQUIRING_IOC_DEPS);
                    }
                    suite.ioc = iocDeps;
                    let mappedDeps = createInjector(suite, deps);
                    try {
                        d.exit();
                    }
                    finally {
                        process.nextTick(startWholeShebang, mappedDeps);
                    }
                });
            });
        }
        function startWholeShebang(deps) {
            const d = domain.create();
            d.once('error', function ($err) {
                d.exit();
                process.nextTick(gracefulExit, {
                    message: $err.message || $err,
                    stack: $err.stack || $err,
                    sumanFatal: true,
                    sumanExitCode: suman_constants_1.constants.EXIT_CODES.ERROR_IN_ROOT_SUITE_BLOCK
                });
            });
            Object.defineProperty(suite, 'shared', { value: new vamoot_1.VamootProxy(), writable: false });
            d.run(function () {
                suite.fatal = function (err) {
                    process.nextTick(gracefulExit, {
                        message: 'Fatal error experienced in root suite => ' + (err.message || err),
                        stack: err.stack || err,
                        sumanExitCode: suman_constants_1.constants.EXIT_CODES.ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION
                    });
                };
                if (delayOptionElected) {
                    suite.isDelayed = true;
                    const to = setTimeout(function () {
                        console.log('\n\n => Suman fatal error => suite.resume() function was not called within alloted time.');
                        process.exit(suman_constants_1.constants.EXIT_CODES.DELAY_FUNCTION_TIMED_OUT);
                    }, _suman.weAreDebugging ? 5000000 : 11000);
                    if (sumanOpts.verbosity > 8) {
                        console.log(' => Waiting for delay() function to be called...');
                    }
                    let callable = true;
                    suite.__resume = function (val) {
                        if (callable) {
                            callable = false;
                            clearTimeout(to);
                            process.nextTick(function () {
                                suman.ctx = null;
                                suite.isSetupComplete = true;
                                suite.invokeChildren(val, start);
                            });
                        }
                        else {
                            _suman.log.error('Suman usage warning => suite.resume() was called more than once.');
                        }
                    };
                    const str = cb.toString();
                    if (!su.checkForValInStr(str, /resume/g, 0)) {
                        process.nextTick(function () {
                            console.error(new Error(' => Suman usage error => suite.resume() method needs to be called to continue,' +
                                ' but the resume method was never referenced, so your test cases would never be invoked before timing out.').stack
                                + '\n =>' + str);
                            process.exit(suman_constants_1.constants.EXIT_CODES.DELAY_NOT_REFERENCED);
                        });
                    }
                    else {
                        cb.apply(suite, deps);
                    }
                }
                else {
                    suite.__resume = function () {
                        _suman.log.warning('usage warning => suite.resume() has become a noop since delay option is falsy.');
                    };
                    cb.apply(null, deps);
                    suite.isSetupComplete = true;
                    handle_injections_1.handleInjections(suite, function (err) {
                        if (err) {
                            _suman.log.error(err.stack || err);
                            gracefulExit(err, null);
                        }
                        else {
                            process.nextTick(function () {
                                suite.invokeChildren(null, start);
                            });
                        }
                    });
                }
            });
        }
        const start = function () {
            _suman.suiteResultEmitter.emit('suman-test-registered', function () {
                const sumanOpts = suman.opts;
                const currentPaddingCount = _suman.currentPaddingCount
                    = (_suman.currentPaddingCount || {});
                currentPaddingCount.val = 1;
                const runSuite = function (suite, cb) {
                    if (_suman.uncaughtExceptionTriggered) {
                        _suman.log.error(`"UncaughtException:Triggered" => halting program.\n[${__filename}]`);
                        return;
                    }
                    let limit = 1;
                    if (suite.parallel) {
                        if (suite.limit) {
                            limit = Math.min(suite.limit, 300);
                        }
                        else {
                            limit = sumanConfig.DEFAULT_PARALLEL_BLOCK_LIMIT || suman_constants_1.constants.DEFAULT_PARALLEL_BLOCK_LIMIT;
                        }
                    }
                    assert(Number.isInteger(limit) && limit > 0 && limit < 100, 'limit must be an integer between 1 and 100, inclusive.');
                    suite.startSuite(function (err, results) {
                        results && _suman.log.error('Suman extraneous results:', results);
                        err && _suman.log.error('Suman extraneous test error:', suite);
                        const children = suite.getChildren().filter(function (child) {
                            return !child.skipped;
                        });
                        if (children.length < 1) {
                            return process.nextTick(cb);
                        }
                        sumanOpts.series && (currentPaddingCount.val += 3);
                        async.eachLimit(children, limit, function (child, cb) {
                            runSuite(child, cb);
                        }, function (err) {
                            sumanOpts.series && (currentPaddingCount.val -= 3);
                            err && _suman.log.error('Suman implementation error:', err.stack || err);
                            process.nextTick(cb);
                        });
                    });
                };
                runSuite(allDescribeBlocks[0], function complete() {
                    suman.dateSuiteFinished = Date.now();
                    if (_suman.uncaughtExceptionTriggered) {
                        _suman.log.error(`"UncaughtException" event => halting program.\n[${__filename}]`);
                        return;
                    }
                    if (sumanOpts.parallel_max) {
                        suman.getQueue().drain = function () {
                            onSumanCompleted(0, null);
                        };
                    }
                    else {
                        onSumanCompleted(0, null);
                    }
                });
            });
        };
    };
};
