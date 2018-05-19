'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const pragmatik = require('pragmatik');
const _suman = global.__suman = (global.__suman || {});
const rules = require("../helpers/handle-varargs");
const { constants } = require('../../config/suman-constants');
const general_1 = require("../helpers/general");
const handleBadOptions = function (opts) {
    if (opts.plan !== undefined && !Number.isInteger(opts.plan)) {
        console.error(' => Suman usage error => "plan" option is not an integer.');
        process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
        return;
    }
};
exports.makeAfterAllParentHooks = function (suman) {
    return function afterAllParentHooks($desc, $opts) {
        const zuite = suman.ctx;
        general_1.handleSetupComplete(zuite, afterAllParentHooks.name);
        const isPreParsed = $opts && $opts.__preParsed;
        const args = pragmatik.parse(arguments, rules.hookSignature, isPreParsed);
        try {
            delete $opts.__preParsed;
        }
        catch (err) {
        }
        const vetted = general_1.parseArgs(args);
        const [desc, opts, fn] = vetted.args;
        const arrayDeps = vetted.arrayDeps;
        handleBadOptions(opts);
        if (arrayDeps.length > 0) {
            general_1.evalOptions(arrayDeps, opts);
        }
        if (opts.skip) {
            suman.numHooksSkipped++;
        }
        else if (!fn) {
            suman.numHooksStubbed++;
        }
        else {
            zuite.getAfterAllParentHooks().push({
                ctx: zuite,
                timeout: opts.timeout || 11000,
                desc: desc || fn.name,
                cb: opts.cb === true,
                throws: opts.throws,
                successEvents: opts.successEvents,
                errorEvents: opts.errorEvents,
                events: opts.events,
                always: opts.always,
                last: opts.last,
                planCountExpected: opts.plan,
                fatal: !(opts.fatal === false),
                fn: fn,
                type: 'afterAllParentHooks',
                warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
            });
        }
        return zuite;
    };
};
