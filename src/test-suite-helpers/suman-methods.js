'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const define_options_classes_1 = require("./define-options-classes");
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const assert = require("assert");
const pragmatik = require('pragmatik');
const _suman = global.__suman = (global.__suman || {});
const make_after_all_parent_hooks_1 = require("../test-suite-methods/make-after-all-parent-hooks");
const rules = require("../helpers/handle-varargs");
const { constants } = require('../../config/suman-constants');
const block_injector_1 = require("../injection/block-injector");
const create_injector_1 = require("../injection/create-injector");
const make_it_1 = require("../test-suite-methods/make-it");
const make_after_1 = require("../test-suite-methods/make-after");
const make_after_each_1 = require("../test-suite-methods/make-after-each");
const make_before_each_1 = require("../test-suite-methods/make-before-each");
const make_before_1 = require("../test-suite-methods/make-before");
const make_inject_1 = require("../test-suite-methods/make-inject");
const make_describe_1 = require("../test-suite-methods/make-describe");
const make_before_block_1 = require("../test-suite-methods/make-before-block");
const make_after_block_1 = require("../test-suite-methods/make-after-block");
const possibleProps = {
    describe: true,
    beforeeach: true,
    beforeeachblock: true,
    aftereachblock: true,
    aftereach: true,
    beforeall: true,
    afterall: true,
    after: true,
    before: true,
    context: true,
    it: true,
    test: true,
    setuptest: true,
    teardowntest: true,
    setup: true,
    teardown: true,
    events: true,
    errorevents: true,
    successevents: true,
    skip: true,
    retries: true,
    fatal: true,
    parallel: true,
    series: true,
    cb: true,
    only: true,
    plan: true,
    throws: true,
    timeout: true,
    always: true,
    last: true,
    __preparsed: true
};
const makeProxy = function (suman) {
    return function getProxy(method, rule, props) {
        return new Proxy(method, {
            get: function (target, prop) {
                if (typeof prop === 'symbol') {
                    return Reflect.get.apply(Reflect, arguments);
                }
                props = props || [];
                if (prop === 'define') {
                    return target.define;
                }
                let hasSkip = false;
                let newProps = props.concat(String(prop))
                    .map(v => String(v).toLowerCase())
                    .filter(function (v, i, a) {
                    if (v === 'skip' || v === 'skipped') {
                        hasSkip = true;
                    }
                    return a.indexOf(v) === i;
                })
                    .sort();
                if (hasSkip) {
                    newProps = ['skip'];
                }
                let cache, cacheId = newProps.join('-');
                let fnCache = suman.testBlockMethodCache.get(method);
                if (!fnCache) {
                    fnCache = {};
                    suman.testBlockMethodCache.set(method, fnCache);
                }
                if (cache = suman.testBlockMethodCache.get(method)[cacheId]) {
                    return cache;
                }
                let fn = function () {
                    let args = pragmatik.parse(arguments, rule);
                    newProps.forEach(function (p) {
                        args[1][p] = true;
                    });
                    args[1].__preParsed = true;
                    return method.apply(null, args);
                };
                fn.define = target.define;
                fn.define.props = newProps;
                return fnCache[cacheId] = getProxy(fn, rule, newProps);
            }
        });
    };
};
const addDefine = function (fn, Clazz) {
    fn.define = function (desc, f) {
        if (typeof desc === 'function') {
            f = desc;
            desc = null;
        }
        const defObj = new Clazz(desc, fn);
        if (fn.define.props) {
            fn.define.props.forEach(function (p) {
                defObj.opts[p] = true;
            });
            delete fn.define.props;
        }
        if (f) {
            assert(typeof f === 'function', 'Optional argument to define() was expected to be a function.');
            f.call(null, defObj);
        }
        return defObj;
    };
    return fn;
};
exports.makeSumanMethods = function (suman, gracefulExit, handleBeforesAndAfters, notifyParent) {
    const m = {};
    suman.containerProxy = m;
    const blockInjector = block_injector_1.makeBlockInjector(suman, m);
    const createInjector = create_injector_1.makeCreateInjector(suman, m);
    const inject = addDefine(make_inject_1.makeInject(suman), define_options_classes_1.DefineOptionsInjectHook);
    const before = addDefine(make_before_1.makeBefore(suman), define_options_classes_1.DefineObjectAllHook);
    const after = addDefine(make_after_1.makeAfter(suman), define_options_classes_1.DefineObjectAllHook);
    const beforeEachBlock = addDefine(make_before_block_1.makeBeforeBlock(suman), define_options_classes_1.DefineObjectAllHook);
    const afterEachBlock = addDefine(make_after_block_1.makeAfterBlock(suman), define_options_classes_1.DefineObjectAllHook);
    const beforeEach = addDefine(make_before_each_1.makeBeforeEach(suman), define_options_classes_1.DefineObjectEachHook);
    const afterEach = addDefine(make_after_each_1.makeAfterEach(suman), define_options_classes_1.DefineObjectEachHook);
    const it = addDefine(make_it_1.makeIt(suman), define_options_classes_1.DefineObjectTestCase);
    const afterAllParentHooks = addDefine(make_after_all_parent_hooks_1.makeAfterAllParentHooks(suman), define_options_classes_1.DefineObjectAllHook);
    const describe = addDefine(make_describe_1.makeDescribe(suman, gracefulExit, notifyParent, blockInjector, handleBeforesAndAfters), define_options_classes_1.DefineObjectContext);
    const getProxy = makeProxy(suman);
    m.describe = m.context = m.suite = getProxy(describe, rules.blockSignature);
    m.it = m.test = getProxy(it, rules.testCaseSignature);
    m.inject = getProxy(inject, rules.hookSignature);
    m.before = m.beforeall = m.setup = getProxy(before, rules.hookSignature);
    m.beforeeach = m.beforeEach = m.setupTest = m.setuptest = getProxy(beforeEach, rules.hookSignature);
    m.after = m.afterAll = m.afterall = m.teardown = m.tearDown = getProxy(after, rules.hookSignature);
    m.aftereach = m.afterEach = m.tearDownTest = m.teardownTest = m.teardowntest = getProxy(afterEach, rules.hookSignature);
    m.afterallparenthooks = m.afterAllParentHooks = getProxy(afterAllParentHooks, rules.hookSignature);
    m.beforeeachblock = m.beforeEachBlock = m.beforeeachchild = m.beforeEachChild = getProxy(beforeEachBlock, rules.hookSignature);
    m.aftereachblock = m.afterEachBlock = m.aftereachchild = m.afterEachChild = getProxy(afterEachBlock, rules.hookSignature);
    return createInjector;
};
