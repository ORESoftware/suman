'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const pragmatik = require('pragmatik');
const su = require("suman-utils");
const _suman = global.__suman = (global.__suman || {});
const rules = require("../helpers/handle-varargs");
const { constants } = require('../../config/suman-constants');
const general_1 = require("../helpers/general");
const general_2 = require("../helpers/general");
const general_3 = require("../helpers/general");
const acceptableOptions = {
    '@DefineObjectOpts': true,
    plan: true,
    throws: true,
    fatal: true,
    retries: true,
    cb: true,
    val: true,
    value: true,
    __toBeSourcedForIOC: true,
    parallel: true,
    desc: true,
    title: true,
    series: true,
    mode: true,
    timeout: true,
    only: true,
    skip: true,
    events: true,
    successEvent: true,
    errorEvent: true,
    successEvents: true,
    errorEvents: true,
    __preParsed: true
};
const handleBadOptions = function (opts, typeName) {
    Object.keys(opts).forEach(function (k) {
        if (!acceptableOptions[k]) {
            const url = `${constants.SUMAN_TYPES_ROOT_URL}/${typeName}.d.ts`;
            throw new Error(`'${k}' is not a valid option property for an ${typeName} hook. See: ${url}`);
        }
    });
    if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
        console.error(' => Suman usage error => "plan" option is not an integer.');
        process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
        return;
    }
};
let id = 1;
const incr = function () {
    return id++;
};
exports.makeIt = function (suman) {
    return function it($desc, $opts) {
        const typeName = it.name;
        const sumanOpts = suman.opts, zuite = suman.ctx;
        general_1.handleSetupComplete(zuite, typeName);
        const args = pragmatik.parse(arguments, rules.testCaseSignature, {
            preParsed: su.isObject($opts) ? $opts.__preParsed : null
        });
        try {
            delete $opts.__preParsed;
        }
        catch (err) {
        }
        const vetted = general_2.parseArgs(args);
        const [desc, opts, fn] = vetted.args;
        const arrayDeps = vetted.arrayDeps;
        handleBadOptions(opts, typeName);
        if (arrayDeps.length > 0) {
            general_3.evalOptions(arrayDeps, opts);
        }
        if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
            console.error(' => Suman usage error => "plan" option is not an integer.');
            process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
            return;
        }
        if (opts.hasOwnProperty('parallel')) {
            if (opts.hasOwnProperty('mode')) {
                _suman.log.warning('warning => Used both parallel and mode options => mode will take precedence.');
                if (opts.mode !== 'parallel' && opts.mode !== 'series' && opts.mode !== 'serial') {
                    _suman.log.warning('warning => valid "môde" options are only values of "parallel" or "series" or "serial"' +
                        ' => ("serial" is an alias to "series").');
                }
            }
        }
        const inc = incr();
        if (!_suman.inBrowser && !sumanOpts.force) {
            if (opts.skip && !sumanOpts.$allowSkip) {
                throw new Error('Test case was declared as "skipped" but "--allow-skip" option not specified.');
            }
            if (opts.only && !sumanOpts.$allowOnly) {
                throw new Error('Test case was declared as "only" but "--allow-only" option not specified.');
            }
        }
        if (opts.skip || opts.skipped) {
            zuite.getTests().push({ testId: inc, desc: desc, skipped: true });
            return zuite;
        }
        if (!fn) {
            zuite.getTests().push({ testId: inc, desc: desc, stubbed: true });
            return zuite;
        }
        if (suman.itOnlyIsTriggered && !opts.only) {
            zuite.getTests().push({ testId: inc, desc: desc, skipped: true, skippedDueToItOnly: true });
            return zuite;
        }
        if (opts.only) {
            suman.itOnlyIsTriggered = true;
        }
        const isSeries = zuite.series || opts.series === true || opts.parallel === false;
        const isFixedParallel = !isSeries && (zuite.parallel || opts.parallel === true || opts.mode === 'parallel');
        const isParallel = (sumanOpts.parallel || sumanOpts.parallel_max) || (!sumanOpts.series && isFixedParallel);
        const isOverallParallel = (opts.fixed && isFixedParallel) || isParallel;
        const testData = {
            alreadyInitiated: false,
            testId: inc,
            stubbed: false,
            data: {},
            planCountExpected: opts.plan,
            originalOpts: opts,
            only: opts.only,
            skip: opts.skip,
            value: opts.value,
            retries: opts.retries,
            throws: opts.throws,
            successEvents: opts.successEvents,
            errorEvents: opts.errorEvents,
            events: opts.events,
            fixed: opts.fixed,
            parallel: isOverallParallel,
            mode: opts.mode,
            delay: opts.delay,
            state: 'pending',
            cb: opts.cb === true,
            type: typeName,
            timeout: opts.timeout || 20000,
            desc: desc || opts.desc || fn.name || '(unknown test case name)',
            fn: fn,
            warningErr: new Error('SUMAN_TEMP_WARNING_ERROR'),
            timedOut: false,
            complete: false,
            error: null
        };
        if (isOverallParallel) {
            zuite.getParallelTests().push(testData);
        }
        else {
            zuite.getTests().push(testData);
        }
        return zuite;
    };
};
