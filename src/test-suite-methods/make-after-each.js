'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const pragmatik = require('pragmatik');
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
    ioc: true,
    __toBeSourcedForIOC: true,
    retries: true,
    cb: true,
    timeout: true,
    skip: true,
    desc: true,
    title: true,
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
        _suman.log.error(new Error(' => Suman usage error => "plan" option is not an integer.').stack);
        process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
        return;
    }
};
exports.makeAfterEach = function (suman) {
    return function afterEach($$desc, $opts) {
        const typeName = afterEach.name;
        const zuite = suman.ctx;
        general_1.handleSetupComplete(zuite, typeName);
        const isPreParsed = $opts && $opts.__preParsed;
        const args = pragmatik.parse(arguments, rules.hookSignature, isPreParsed);
        try {
            delete $opts.__preParsed;
        }
        catch (err) {
        }
        const vetted = general_3.parseArgs(args);
        const [desc, opts, fn] = vetted.args;
        const arrayDeps = vetted.arrayDeps;
        handleBadOptions(opts, typeName);
        if (arrayDeps.length > 0) {
            general_2.evalOptions(arrayDeps, opts);
        }
        if (opts.skip) {
            suman.numHooksSkipped++;
        }
        else if (!fn) {
            suman.numHooksStubbed++;
        }
        else {
            zuite.getAfterEaches().push({
                ctx: zuite,
                timeout: opts.timeout || 11000,
                desc: desc || fn.name || '(unknown afterEach-hook name)',
                cb: opts.cb === true,
                successEvents: opts.successEvents,
                errorEvents: opts.errorEvents,
                retries: opts.retries,
                events: opts.events,
                throws: opts.throws,
                planCountExpected: opts.plan,
                fatal: opts.fatal === true,
                fn: fn,
                type: 'afterEach/teardownTest',
                warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
            });
        }
        return zuite;
    };
};
