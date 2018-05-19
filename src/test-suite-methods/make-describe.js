'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const util = require("util");
const assert = require("assert");
const domain = require("domain");
const fnArgs = require('function-arguments');
const pragmatik = require('pragmatik');
const su = require("suman-utils");
const McProxy = require("proxy-mcproxy");
const _suman = global.__suman = (global.__suman || {});
const rules = require("../helpers/handle-varargs");
const suman_constants_1 = require("../../config/suman-constants");
const acquire_ioc_deps_1 = require("../acquire-dependencies/acquire-ioc-deps");
const general_1 = require("../helpers/general");
const handle_injections_1 = require("../test-suite-helpers/handle-injections");
const general_2 = require("../helpers/general");
const general_3 = require("../helpers/general");
const test_suite_1 = require("../test-suite-helpers/test-suite");
const typeName = 'describe';
const acceptableOptions = {
    '@DefineObjectOpts': true,
    skip: true,
    only: true,
    __toBeSourcedForIOC: true,
    delay: true,
    desc: true,
    title: true,
    parallel: true,
    retries: true,
    limit: true,
    series: true,
    mode: true,
    __preParsed: true
};
const handleBadOptions = function (opts, typeName) {
    Object.keys(opts).forEach(function (k) {
        if (!acceptableOptions[k]) {
            const url = `${suman_constants_1.constants.SUMAN_TYPES_ROOT_URL}/${typeName}.d.ts`;
            throw new Error(`'${k}' is not a valid option property for ${typeName} hooks. See: ${url}`);
        }
    });
};
exports.makeDescribe = function (suman, gracefulExit, notifyParent, blockInjector, handleBeforesAndAfters) {
    return function describe($$desc, $opts) {
        const sumanOpts = suman.opts, zuite = suman.ctx;
        general_1.handleSetupComplete(zuite, describe.name);
        const isPreParsed = su.isObject($opts) && $opts.__preParsed;
        const args = pragmatik.parse(arguments, rules.blockSignature, isPreParsed);
        try {
            delete $opts.__preParsed;
        }
        catch (err) {
        }
        const vetted = general_2.parseArgs(args);
        const [desc, opts, cb] = vetted.args;
        const arrayDeps = vetted.arrayDeps;
        handleBadOptions(opts, describe.name);
        let iocDepNames;
        if (arrayDeps.length > 0) {
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
        const allDescribeBlocks = suman.allDescribeBlocks;
        if (su.isGeneratorFn(cb) || su.isAsyncFn(cb)) {
            const msg = suman_constants_1.constants.ERROR_MESSAGES.INVALID_FUNCTION_TYPE_USAGE;
            console.error('\n');
            _suman.log.error(msg);
            _suman.log.error(new Error('Suman usage error => invalid generator/async/await function usage.').stack);
            return process.exit(suman_constants_1.constants.EXIT_CODES.INVALID_ARROW_FUNCTION_USAGE);
        }
        if (zuite.parallel && opts.parallel === false) {
            console.error('\n');
            _suman.log.warning('warning => parent block ("' + zuite.desc + '") is parallel, ' +
                'so child block ("' + desc + '") will be run in parallel with other sibling blocks.');
            _suman.log.warning('\nTo see more info on this, visit: sumanjs.org.\n');
        }
        if (zuite.skipped) {
            let msg = 'Suman implementation warning => Child block entered when parent was skipped.';
            _suman.log.error(msg);
            _suman.log.error(' => Please open an issue with the following stacktrace:', '\n');
            _suman.log.error(new Error(msg).stack);
            console.log('\n');
        }
        if (!sumanOpts.force && !_suman.inBrowser) {
            if (opts.skip && !sumanOpts.allow_skip && !sumanOpts.$allowSkip) {
                throw new Error('Test block was declared as "skipped" but "--allow-skip" / "--force" option not specified.');
            }
            if (opts.only && !sumanOpts.allow_only && !sumanOpts.$allowOnly) {
                throw new Error('Test block was declared as "only" but "--allow-only" / "--force" option not specified.');
            }
        }
        if (opts.skip || zuite.skipped || (!opts.only && suman.describeOnlyIsTriggered)) {
            suman.numBlocksSkipped++;
            return;
        }
        const suite = new test_suite_1.TestBlock({ desc, title: desc, opts, suman, notifyParent, handleBeforesAndAfters, gracefulExit });
        if (zuite.fixed) {
            suite.fixed = true;
        }
        suite.skipped = opts.skip || zuite.skipped;
        if (!suite.only && suman.describeOnlyIsTriggered) {
            suite.skipped = suite.skippedDueToDescribeOnly = true;
        }
        if (suite.only) {
            suman.describeOnlyIsTriggered = true;
        }
        Object.defineProperty(suite, 'parent', { value: zuite, writable: false });
        zuite.getChildren().push(suite);
        allDescribeBlocks.push(suite);
        if (typeof cb !== 'function') {
            throw new Error('Usage error: The following value was expected to be a function but is not => ' + util.inspect(cb));
        }
        const deps = fnArgs(cb);
        suite.bIsFirstArg = deps[0] === 'b';
        if (suite.parent.bIsFirstArg) {
            assert(suite.bIsFirstArg, 'First argument name for describe/context block callbacks must be "b" (for "block").');
        }
        suite._run = function (val, callback) {
            if (zuite.skipped || zuite.skippedDueToDescribeOnly) {
                notifyParent(zuite, callback);
                return;
            }
            const d = domain.create();
            d.once('error', function (err) {
                console.error('\n');
                if (!err || typeof err !== 'object') {
                    err = new Error(err ? (typeof err === 'string' ? err : util.inspect(err)) : 'unknown error passed to handler');
                }
                _suman.log.error('Error registering test block =>', err.stack || err);
                err.sumanExitCode = suman_constants_1.constants.EXIT_CODES.ERROR_IN_CHILD_SUITE;
                gracefulExit(err);
            });
            d.run(function registerTheBlock() {
                suite.getResumeValue = function () {
                    return val;
                };
                suite.bindExtras();
                Object.defineProperty(suite, 'shared', {
                    value: zuite.shared.clone(),
                    writable: false
                });
                let v = suite.__supply = Object.create(zuite.__supply);
                suite.supply = McProxy.create(v);
                const iocDepsParent = Object.create(zuite.ioc);
                acquire_ioc_deps_1.acquireIocDeps(suman, iocDepNames, suite, iocDepsParent, function (err, iocDeps) {
                    if (err) {
                        _suman.log.error(err.stack || err);
                        return process.exit(suman_constants_1.constants.EXIT_CODES.ERROR_ACQUIRING_IOC_DEPS);
                    }
                    suite.ioc = iocDeps;
                    process.nextTick(function () {
                        let $deps;
                        try {
                            $deps = blockInjector(suite, zuite, deps);
                        }
                        catch (err) {
                            return gracefulExit(err);
                        }
                        suite.fatal = function (err) {
                            err = err || new Error(' => suite.fatal() was called by the developer => fatal unspecified error.');
                            _suman.log.error(err.stack || err);
                            err.sumanExitCode = suman_constants_1.constants.EXIT_CODES.ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION;
                            gracefulExit(err);
                        };
                        const delayOptionElected = !!opts.delay;
                        if (!delayOptionElected) {
                            suite.__resume = function () {
                                _suman.log.warning('usage warning => suite.resume() has become a no-op since delay option is falsy.');
                            };
                            cb.apply(null, $deps);
                            handle_injections_1.handleInjections(suite, function (err) {
                                if (err) {
                                    return gracefulExit(err);
                                }
                                d.exit();
                                suite.isSetupComplete = true;
                                process.nextTick(function () {
                                    zuite.bindExtras();
                                    suite.invokeChildren(null, callback);
                                });
                            });
                        }
                        else {
                            suite.isDelayed = true;
                            const to = setTimeout(function () {
                                _suman.log.error('Suman fatal error => delay function was not called within alloted time.');
                                process.exit(suman_constants_1.constants.EXIT_CODES.DELAY_FUNCTION_TIMED_OUT);
                            }, _suman.weAreDebugging ? 5000000 : 11000);
                            let callable = true;
                            suite.__resume = function (val) {
                                if (callable) {
                                    callable = false;
                                    clearTimeout(to);
                                    d.exit();
                                    process.nextTick(function () {
                                        suite.isSetupComplete = true;
                                        zuite.bindExtras();
                                        suite.invokeChildren(val, callback);
                                    });
                                }
                                else {
                                    let w = 'Suman usage warning => suite.resume() was called more than once.';
                                    _suman.log.error(w);
                                    _suman.writeTestError(w);
                                }
                            };
                            cb.apply(null, $deps);
                        }
                    });
                });
            });
        };
    };
};
