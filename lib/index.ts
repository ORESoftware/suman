'use strict';

// tsc
import {IGlobalSumanObj, ISumanConfig, SumanErrorRace} from "../dts/global";
import EventEmitter = NodeJS.EventEmitter;
import {ISuman} from "../dts/suman";
import {Stream, Transform, Writable} from "stream";
import {IDescribeFn, IDescribeOpts, TDescribeHook} from "../dts/describe";
import {IIntegrantsMessage, ISumanModuleExtended, TCreateHook} from "../dts/index-init";
import {IHookOrTestCaseParam} from "../dts/test-suite";

// exported imports
export {ISumanOpts, IGlobalSumanObj} from '../dts/global';
export {ITestCaseParam} from '../dts/test-suite';
export {IHookParam} from '../dts/test-suite';
export {IDescribeFn} from '../dts/describe';
export {ItFn, ITestDataObj} from '../dts/it';
export {IBeforeFn} from '../dts/before';
export {IBeforeEachFn} from '../dts/before-each';
export {IAfterFn} from '../dts/after';
export {IAfterEachFn} from '../dts/after-each';

///////////////////////////////////////////////////////

export type TConfigOverride = Partial<ISumanConfig>;

export interface ISumanErrorFirstCB {
  (err: Error | undefined | null, ...args: any[]): void
}

// exported declarations
export interface ILoadOpts {
  path: string,
  indirect: boolean
}

export interface Ioc {
  a: string,
  b: string
}

export interface IIoCData {
  $pre?: Object,

  [key: string]: any
}

export interface IInitOpts {
  export?: boolean,
  __expectedExitCode?: number,
  pre?: Array<string>,
  integrants?: Array<string>,
  series?: boolean,
  writable?: EventEmitter,
  timeout?: number,
  post?: Array<any>,
  interface?: string,
  iocData?: IIoCData,
  ioc?: Object
}

export interface IStartCreate {
  //desc: string, opts?: ICreateOpts, arr?: Array<string | TCreateHook>, cb?: TCreateHook
  (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TCreateHook): void,

  delay?: IDescribeFn,
  skip?: IDescribeFn,
  only?: IDescribeFn
}

export interface IInit {
  (module: ISumanModuleExtended, opts?: IInitOpts, confOverride?: TConfigOverride): IStartCreate,

  $ingletonian?: any,
  tooLate?: boolean
}

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import assert = require('assert');
import path = require('path');
import EE = require('events');
import fs = require('fs');
import stream = require('stream');

// npm
import * as chalk from 'chalk';

const pragmatik = require('pragmatik');
const debug = require('suman-debug')('s:index');

//project
let inBrowser = false;
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
_suman.dateEverythingStarted = Date.now();
require('./helpers/add-suman-global-properties');
require('./patches/all');
import {getClient} from './index-helpers/socketio-child-client';

const sumanOptsFromRunner = _suman.sumanOpts || (process.env.SUMAN_OPTS ? JSON.parse(process.env.SUMAN_OPTS) : {});
const sumanOpts = _suman.sumanOpts = (_suman.sumanOpts || sumanOptsFromRunner);

try {
  window.module = {filename: '/'};
  module.parent = module;
  inBrowser = _suman.inBrowser = true;
}
catch (err) {
  inBrowser = _suman.inBrowser = false;
}

if (_suman.sumanOpts) {
  if (_suman.sumanOpts.verbosity > 8) {
    console.log(' => Are we in browser? => ', inBrowser ? 'yes!' : 'no.');
  }
}
else {
  _suman.logWarning('sumanOpts is not yet defined in runtime.');
}

const sumanRuntimeErrors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
const {fatalRequestReply} = require('./helpers/fatal-request-reply');
import async = require('async');

const {constants} = require('../config/suman-constants');
const IS_SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';

////////////////////////////////////////////////////////////////////

require('./index-helpers/exit-handling');

/////////////////////////////////////////////////////////////////////

// project
import {handleIntegrants} from './index-helpers/handle-integrants';
import setupExtraLoggers from './index-helpers/setup-extra-loggers';

const rules = require('./helpers/handle-varargs');
import {makeSuman} from './suman';
import su = require('suman-utils');

const {execSuite} = require('./exec-suite');
const SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
import {loadSumanConfig} from './helpers/load-suman-config';
import {resolveSharedDirs} from './helpers/resolve-shared-dirs';
import {loadSharedObjects} from './helpers/load-shared-objects'
import {acquireIocStaticDeps} from './acquire-dependencies/acquire-ioc-static-deps';

///////////////////////////////////////////////////////////////////////////////////////////

//integrants
const allOncePreKeys: Array<Array<string>> = _suman.oncePreKeys = [];
const allOncePostKeys: Array<Array<string>> = _suman.oncePostKeys = [];
const suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());

////////////////////////////////////////////////////////////////////////////////////////////

if (!SUMAN_SINGLE_PROCESS) {
  require('./helpers/handle-suman-counts');
}

require('./index-helpers/verify-local-global-version');
const counts = require('./helpers/suman-counts');
const projectRoot = _suman.projectRoot = _suman.projectRoot || su.findProjectRoot(process.cwd()) || '/';
const main = require.main.filename;
const usingRunner = _suman.usingRunner = (_suman.usingRunner || process.env.SUMAN_RUNNER === 'yes');
//could potentially pass dynamic path to suman config here, but for now is static
const sumanConfig = loadSumanConfig(null, null);
if (!_suman.usingRunner && !_suman.viaSuman) {
  require('./helpers/print-version-info'); // just want to run this once
}
const sumanPaths = resolveSharedDirs(sumanConfig, projectRoot, sumanOpts);
const sumanObj = loadSharedObjects(sumanPaths, projectRoot, sumanOpts);
const {integrantPreFn} = sumanObj;
const testDebugLogPath = sumanPaths.testDebugLogPath;
const testLogPath = sumanPaths.testLogPath;
fs.writeFileSync(testDebugLogPath, '\n', {flag: 'w'});
fs.writeFileSync(testLogPath, '\n => New Suman run @' + new Date(), {flag: 'w'});

////////////////////////////////////////////////////////////////////////////////

let loaded = false;
const testSuiteQueueCallbacks: Array<Function> = [];
const c = (sumanOpts && sumanOpts.series) ? 1 : 3;

const testSuiteQueue = async.queue(function (task: Function, cb: Function) {
  testSuiteQueueCallbacks.unshift(cb);
  process.nextTick(task);
}, c);

const testRuns: Array<Function> = [];
const testSuiteRegistrationQueueCallbacks: Array<Function> = [];
const testSuiteRegistrationQueue = async.queue(function (task: Function, cb: Function) {
  // Test.creates need to be registered only one at a time
  testSuiteRegistrationQueueCallbacks.unshift(cb);
  process.nextTick(task);
}, 1);

testSuiteRegistrationQueue.drain = function () {
  testRuns.forEach(function (fn) {
    testSuiteQueue.push(fn);
  });
};

testSuiteQueue.drain = function () {
  suiteResultEmitter.emit('suman-test-file-complete');
};

suiteResultEmitter.on('suman-test-registered', function (fn: Function) {
  testRuns.push(fn);
  process.nextTick(function () {
    let fn = testSuiteRegistrationQueueCallbacks.pop();
    fn && fn.call(null);
  });
});

suiteResultEmitter.on('suman-completed', function () {
  // we set this to null because no suman should be in progress
  process.nextTick(function () {
    let fn = testSuiteQueueCallbacks.pop();
    fn && fn.call(null);
  });
});

/////////////////////////////////////////////////////

export const init: IInit = function ($module, $opts, confOverride): IStartCreate {

  ///////////////////////////////////

  debugger;  // leave this here forever for debugging child processes

  /*
   Please note that the init function is complex by nature. Easily the most complicated function
   in this project by an order of magnitude. Here we have to deal with several different
   conditionals:

   (1) using runner or not
   (2) using suman or node
   (3) SUMAN_SINGLE_PROCESS (running tests all in a single process) or standard
   (4) Waiting for suman.once.pre to finish ("integrants")

   How this function works:

   Test.create/describe/suite are called synchronously; once that function is called,
   we wait for any relevant integrants to start/finish

   */

  ///////////////////////////////////////////////////////

  if (init.$ingletonian) {
    if (!SUMAN_SINGLE_PROCESS) {
      _suman.logError(chalk.red('Suman usage warning => suman.init() only needs to be called once per test script.'));
      return init.$ingletonian;
    }
  }

  if (this instanceof init) {
    _suman.logError('Suman usage warning: no need to use "new" keyword with the suman.init()' +
      ' function as it is not a standard constructor');
    return init.apply(null, arguments);
  }

  require('./handle-exit'); // handle exit here
  require('./helpers/load-reporters-last-ditch').run();

  $module = $module || {filename: '/', exports: {}};

  if (!inBrowser) {
    assert(($module.constructor && $module.constructor.name === 'Module'),
      'Please pass the test file module instance as first arg to suman.init()');
  }

  if (confOverride) {
    assert(su.isObject(confOverride), 'Suman conf override value must be defined, and an object like so => {}.');
    Object.assign(_suman.sumanConfig, confOverride);
  }

  _suman.sumanInitStartDate = (_suman.sumanInitStartDate || Date.now());
  _suman._currentModule = $module.filename;

  // TODO: could potention figure out what original test module is via suman.init call, instead of
  // requiring that user pass it explicitly

  if (!loaded) {
    //note that these calls need to be inside suman.init() so they don't get loaded by the runner, etc.
    //although perhaps we should put the runner code elsewhere, because user does not need to call runner
    //look through version control from Sunday Nov 20th for this code
  }

  if ($opts) {
    assert(su.isObject($opts), 'Please pass an options object as a second argument to suman.init()');
  }

  const opts: IInitOpts = $opts || {};
  if ($module.sumanInitted) {
    throw new Error(`suman.init() already called for this module with filename => ${$module.filename}`);
  }

  $module.sumanInitted = true;

  opts.integrants && assert(Array.isArray(opts.integrants), `'integrants' option must be an array.`);
  opts.pre && assert(Array.isArray(opts.pre), `'pre' option must be an array.`);

  let $integrants = (opts.integrants || opts.pre || []).filter(i => i).map(function (item) {
    assert(typeof item === 'string', `once.pre item must be a string. Instead we have => ${util.inspect(item)}`);
    // filter out empty strings, etc.
    return item;
  });

  // remove falsy elements, for user convenience
  const integrants = $integrants.filter((i: string) => i);

  if (opts.__expectedExitCode !== undefined && !SUMAN_SINGLE_PROCESS) {
    let expectedExitCode = _suman.expectedExitCode = _suman.expectedExitCode || opts.__expectedExitCode;
    assert(Number.isInteger(expectedExitCode) && expectedExitCode > -1, ' => Suman usage error => Expected exit ' +
      'code not an positive/acceptable integer.');
  }

  if (opts.timeout !== undefined && !SUMAN_SINGLE_PROCESS) {
    const timeout = _suman.expectedTimeout = opts.timeout;
    assert(Number.isInteger(timeout) && timeout > 0, ' => Suman usage error => Expected timeout value ' +
      'is not an acceptable integer.');

    setTimeout(function () {
      console.log('\n', new Error('=> Suman test file has timed out -' +
        ' "timeout" value passed to suman.init() has been reached exiting....').stack);
      process.exit(constants.EXIT_CODES.TEST_FILE_TIMEOUT);
    }, timeout);

  }

  opts.post && assert(Array.isArray(opts.post), `'post' option must be an array.`);
  let $oncePost = (opts.post || []).filter(function (item) {
    assert(typeof item === 'string', `once.post key must be a string. Instead we have => ${util.inspect(item)}`);
    // filter out empty strings, etc.
    return item;
  });

  //pass oncePost so that we can use it later when we need to
  allOncePostKeys.push($oncePost);
  allOncePreKeys.push(integrants);

  const _interface = String(opts.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
  const iocData: IIoCData = opts.iocData || opts.ioc || {};

  if (iocData) {
    try {
      assert(typeof iocData === 'object' && !Array.isArray(iocData),
        chalk.red(' => Suman usage error => "ioc" property passed to suman.init() needs ' +
          'to point to an object'));
    }
    catch (err) {
      _suman.logError(err.stack || err);
      process.exit(constants.EXIT_CODES.IOC_PASSED_TO_SUMAN_INIT_BAD_FORM);
    }
  }

  //////////////////////////////////////////////////////////////////

  setupExtraLoggers(usingRunner, testDebugLogPath, testLogPath, $module);
  const integrantsFn = handleIntegrants(integrants, $oncePost, integrantPreFn, $module);
  init.tooLate = false;

  const start: IStartCreate = function (desc, opts, arr, cb) {

    //this call will validate args
    const args = pragmatik.parse(arguments, rules.createSignature);
    args[1].__preParsed = true;

    if (init.tooLate === true && !SUMAN_SINGLE_PROCESS) {
      console.error(' => Suman usage fatal error => You must call Test.describe() synchronously => ' +
        'in other words, all Test.describe() calls should be registered in the same tick of the event loop.');
      return process.exit(constants.EXIT_CODES.ASYNCHRONOUS_CALL_OF_TEST_DOT_DESCRIBE);
    }

    process.nextTick(function () {
      init.tooLate = true;
    });

    const to = setTimeout(function () {
      console.error(' => Suman usage error => Integrant acquisition timeout.');
      process.exit(constants.EXIT_CODES.INTEGRANT_ACQUISITION_TIMEOUT);
    }, _suman.weAreDebugging ? 50000000 : 500000);

    function onPreVals(vals: Array<any>) {

      clearTimeout(to);
      _suman['$pre'] = JSON.parse(su.customStringify(vals));
      _suman.userData = JSON.parse(su.customStringify(iocData));

      //TODO: need to properly toggle boolean that determines whether or not to try to create dir
      makeSuman($module, _interface, true, sumanConfig, function (err: Error, suman: ISuman) {

        if (err) {
          _suman.writeTestError(err.stack || err);
          return process.exit(constants.EXIT_CODES.ERROR_CREATED_SUMAN_OBJ);
        }

        suman.iocData = JSON.parse(su.customStringify(iocData));
        const run = execSuite(suman);

        try {
          process.domain && process.domain.exit();
        }
        finally {
          global.setImmediate(function () {
            // IMPORTANT: setImmediate guarantees registry of multiple test suites referenced in the same file
            testSuiteRegistrationQueue.push(function () {
              //args are most likely (desc,opts,cb)
              run.apply(null, args);
            });
          });
        }
      });
    }

    //we run integrants function
    acquireIocStaticDeps()
    .catch(function (err) {
      clearTimeout(to);
      _suman.logError(err.stack || err);
      _suman.writeTestError(err.stack || err);
      process.exit(constants.EXIT_CODES.IOC_STATIC_ACQUISITION_ERROR);
    })
    .then(function () {
      return integrantsFn();
    })
    .catch(function (err: Error) {
      clearTimeout(to);
      _suman.logError(err.stack || err);
      _suman.writeTestError(err.stack || err);
      process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_ERROR);
    })
    .then(onPreVals)
    .catch(function (err: Error) {
      _suman.logError(err.stack || err);
      _suman.writeTestError(err.stack || err);
      process.exit(constants.EXIT_CODES.PRE_VALS_ERROR);
    })

  };

  init.$ingletonian = {
    parent: $module.parent, //parent is who required the original $module
    file: _suman.sumanTestFile = $module.filename
  };

  start.skip = init.$ingletonian.skip = function () {
    const args = pragmatik.parse(arguments, rules.createSignature);
    args[1].skip = true;
    start.apply(this, args);
  };

  start.only = init.$ingletonian.only = function () {
    const args = pragmatik.parse(arguments, rules.createSignature);
    _suman.describeOnlyIsTriggered = true;
    args[1].only = true;
    start.apply(this, args);
  };

  start.delay = init.$ingletonian.delay = function () {
    const args = pragmatik.parse(arguments, rules.createSignature);
    args[1].delay = true;
    start.apply(this, args);
  };

  const create = init.$ingletonian.create = start;
  _interface === 'TDD' ? init.$ingletonian.suite = create : init.$ingletonian.describe = create;
  loaded = true;
  return init.$ingletonian;

};

//TODO: https://gist.github.com/PaulMougel/7961469

export const autoPass = function (t: IHookOrTestCaseParam) {
  // add t.skip() type functionality // t.ignore().
  if (t.callbackMode) {
    t.done();
  }
};

export const autoFail = function (t: IHookOrTestCaseParam) {
  let err = new Error('Suman auto-fail. Perhaps flesh-out this hook or test to get it passing.');
  if (t.callbackMode) {
    t.done(err)
  }
  else {
    return Promise.reject(err);
  }
};

export const once = function (fn: Function) {
  let cache: any = null;

  return function (cb: Function) {

    if (cache) {
      process.nextTick(cb, null, cache);
      return;
    }

    fn.call(null, function (err: Error, val: any) {
      if (!err) {
        cache = val || {'Suman says': 'This is a dummy-cache val. See => sumanjs.org/tricks-and-tips.html'};
      }
      cb.call(null, err, cache);
    });

  }
};

try {
  window.suman = module.exports;
  console.log(' => "suman" is now available as a global variable in the browser.');
}
catch (err) {
}

const $exports = module.exports;
export default $exports;
