'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var pragmatik = require('pragmatik');
var _suman = global.__suman = (global.__suman || {});
var rules = require("../helpers/handle-varargs");
var constants = require('../../config/suman-constants').constants;
var general_1 = require("../helpers/general");
var general_2 = require("../helpers/general");
var general_3 = require("../helpers/general");
var acceptableOptions = {
    '@DefineObjectOpts': true,
    plan: true,
    throws: true,
    fatal: true,
    cb: true,
    desc: true,
    title: true,
    __toBeSourcedForIOC: true,
    timeout: true,
    retries: true,
    skip: true,
    always: true,
    first: true,
    last: true,
    events: true,
    successEvent: true,
    errorEvent: true,
    successEvents: true,
    errorEvents: true,
    __preParsed: true
};
var handleBadOptions = function (opts, typeName) {
    Object.keys(opts).forEach(function (k) {
        if (!acceptableOptions[k]) {
            var url = constants.SUMAN_TYPES_ROOT_URL + "/" + typeName + ".d.ts";
            throw new Error("'" + k + "' is not a valid option property for an " + typeName + " hook. See: " + url);
        }
    });
    if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
        console.error(' => Suman usage error => "plan" option is not an integer.');
        process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
        return;
    }
};
exports.makeAfterBlock = function (suman) {
    return function afterBlock($desc, $opts) {
        var zuite = suman.ctx;
        general_1.handleSetupComplete(zuite, afterBlock.name);
        var isPreParsed = $opts && $opts.__preParsed;
        var args = pragmatik.parse(arguments, rules.hookSignature, isPreParsed);
        try {
            delete $opts.__preParsed;
        }
        catch (err) {
        }
        var vetted = general_3.parseArgs(args);
        var _a = vetted.args, desc = _a[0], opts = _a[1], fn = _a[2];
        var arrayDeps = vetted.arrayDeps;
        handleBadOptions(opts, afterBlock.name);
        if (arrayDeps.length > 0) {
            general_2.evalOptions(arrayDeps, opts);
        }
        if (opts.last && opts.first) {
            throw new Error('Cannot use both "first" and "last" option for "after" hook.');
        }
        if (opts.skip) {
            suman.numHooksSkipped++;
        }
        else if (!fn) {
            suman.numHooksStubbed++;
        }
        else {
            var obj = {
                last: Boolean(opts.last),
                first: Boolean(opts.first),
                ctx: zuite,
                timeout: opts.timeout || 11000,
                desc: desc || fn.name || '(unknown after-all-hook name)',
                cb: opts.cb === true,
                throws: opts.throws,
                always: opts.always,
                retries: opts.retries,
                successEvents: opts.successEvents,
                errorEvents: opts.errorEvents,
                events: opts.events,
                planCountExpected: opts.plan,
                fatal: opts.fatal === true,
                fn: fn,
                type: 'after/teardown',
                warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
            };
            zuite.getAfterBlocks().push(obj);
        }
        return zuite;
    };
};