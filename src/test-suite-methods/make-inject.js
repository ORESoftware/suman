'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const assert = require("assert");
const pragmatik = require('pragmatik');
const _suman = global.__suman = (global.__suman || {});
const general_1 = require("../helpers/general");
const rules = require("../helpers/handle-varargs");
const { constants } = require('../../config/suman-constants');
const general_2 = require("../helpers/general");
const acceptableOptions = {
    '@DefineObjectOpts': true,
    plan: true,
    throws: true,
    fatal: true,
    cb: true,
    timeout: true,
    __toBeSourcedForIOC: true,
    desc: true,
    title: true,
    skip: true,
    events: true,
    successEvents: true,
    errorEvents: true,
    successEvent: true,
    errorEvent: true,
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
        _suman.log.error(new Error('Suman usage error => "plan" option is not an integer.').stack);
        process.exit(constants.EXIT_CODES.OPTS_PLAN_NOT_AN_INTEGER);
        return;
    }
};
exports.makeInject = function (suman) {
    return function inject($desc, $opts, $fn) {
        const typeName = inject.name;
        const zuite = suman.ctx;
        general_2.handleSetupComplete(zuite, typeName);
        const args = pragmatik.parse(arguments, rules.hookSignature, {
            preParsed: typeof $opts === 'object' ? $opts.__preParsed : null
        });
        try {
            delete $opts.__preParsed;
        }
        catch (err) {
        }
        let [desc, opts, arr, fn] = args;
        handleBadOptions(opts, typeName);
        if (arr && fn) {
            throw new Error('Please use either an array or function, but not both.');
        }
        let arrayDeps;
        if (arr) {
            fn = arr[arr.length - 1];
            assert.equal(typeof fn, 'function', ' => Suman usage error => ' +
                'You need to pass a function as the last argument to the array.');
            arrayDeps = arr.slice(0, -1);
        }
        arrayDeps = arrayDeps || [];
        if (arrayDeps.length > 0) {
            general_1.evalOptions(arrayDeps, opts);
        }
        if (opts.skip) {
            _suman.writeTestError(new Error('Suman usage warning => Inject hook was *skipped* by the developer.').stack);
        }
        else if (!fn) {
            _suman.writeTestError(new Error('Suman usage warning => Inject hook was *stubbed* by the developer.').stack);
        }
        else {
            zuite.getInjections().push({
                ctx: zuite,
                desc: desc || fn.name || constants.UNKNOWN_INJECT_HOOK_NAME,
                timeout: opts.timeout || 11000,
                cb: opts.cb === true,
                throws: opts.throws,
                successEvents: opts.successEvents,
                errorEvents: opts.errorEvents,
                events: opts.events,
                planCountExpected: opts.plan,
                fatal: !(opts.fatal === false),
                fn: fn,
                type: typeName,
                warningErr: new Error('SUMAN_TEMP_WARNING_ERROR')
            });
        }
        return zuite;
    };
};
