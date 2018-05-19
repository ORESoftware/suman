'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
if (false) {
    const stdout = process.stdout.write;
    process.stdout.write = function (data) {
        stdout(new Error(String(data)).stack);
        stdout.apply(process.stdout, arguments);
    };
    const stderr = process.stderr.write;
    process.stderr.write = function (data) {
        stderr(new Error(String(data)).stack);
        stderr.apply(process.stderr, arguments);
    };
}
const util = require("util");
const EE = require("events");
const fnArgs = require('function-arguments');
const mapValues = require('lodash.mapvalues');
const chalk = require("chalk");
const suman_events_1 = require("suman-events");
const su = require("suman-utils");
const _suman = global.__suman = (global.__suman || {});
const integrant_injector_1 = require("../injection/integrant-injector");
const suman_constants_1 = require("../../config/suman-constants");
const ascii = require("../helpers/ascii");
const rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const handle_fatal_message_1 = require("./handle-fatal-message");
const log_test_result_1 = require("./log-test-result");
const { onExit } = require('./on-exit');
const make_exit_1 = require("./make-exit");
const handle_integrant_info_1 = require("./handle-integrant-info");
const make_before_exit_once_post_1 = require("./make-before-exit-once-post");
const makeSingleProcess = require('./handle-single-process');
const { makeContainerize } = require('./handle-containerize');
const { makeHandleBrowserProcesses } = require('./handle-browser');
const handle_multiple_processes_1 = require("./handle-multiple-processes");
const IS_SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
const socketio_server_1 = require("./socketio-server");
const socket_cp_hash_1 = require("./socket-cp-hash");
const messages = [];
const oncePosts = {};
const allOncePostKeys = [];
const tableRows = {};
const forkedCPs = [];
const runnerObj = {
    doneCount: 0,
    tableCount: 0,
    listening: true,
    processId: 1,
    startTime: null,
    endTime: null,
    bailed: false,
    queuedCPs: [],
    hasOncePostFile: false,
    innited: false,
    oncePostModule: null,
    oncePostModuleRet: null,
    depContainerObj: null,
    handleBlocking: null
};
const handleIntegrantInfo = handle_integrant_info_1.makeHandleIntegrantInfo(runnerObj, allOncePostKeys);
const exit = make_exit_1.makeExit(runnerObj, tableRows);
const beforeExitRunOncePost = make_before_exit_once_post_1.makeBeforeExit(runnerObj, oncePosts, allOncePostKeys);
{
    _suman.isActualExitHandlerRegistered = true;
    process.once('exit', onExit);
}
process.on('error', function (e) {
    _suman.log.error(`${chalk.magenta('Whoops! "error" event in runner process:')} \n ${chalk.bold(su.getCleanErrorString(e))}`);
});
process.once('uncaughtException', function (e) {
    debugger;
    _suman.log.error(`${chalk.magenta('Suman runner "uncaughtException" event:')} \n ${chalk.bold(su.getCleanErrorString(e))}`);
    process.exit(1);
});
process.on('message', function (data) {
    debugger;
    _suman.log.error('Weird! => Suman runner received an IPC message:\n', chalk.magenta(typeof data === 'string' ? data : util.inspect(data)));
});
const INTEGRANT_INFO = suman_constants_1.constants.runner_message_type.INTEGRANT_INFO;
const TABLE_DATA = suman_constants_1.constants.runner_message_type.TABLE_DATA;
const LOG_RESULT = suman_constants_1.constants.runner_message_type.LOG_RESULT;
const FATAL = suman_constants_1.constants.runner_message_type.FATAL;
const FATAL_MESSAGE_RECEIVED = suman_constants_1.constants.runner_message_type.FATAL_MESSAGE_RECEIVED;
const BROWSER_FINISHED = suman_constants_1.constants.runner_message_type.BROWSER_FINISHED;
const handleTableData = function (n, data, s) {
    runnerObj.tableCount++;
    tableRows[n.shortTestPath].tableData = data;
    s.emit(TABLE_DATA, { info: 'table-data-received' });
};
exports.run = function (runObj, runOnce, $order) {
    debugger;
    const { sumanOpts } = _suman;
    if (sumanOpts.errors_only) {
        rb.emit(String(suman_events_1.events.ERRORS_ONLY_OPTION));
    }
    const server = socketio_server_1.getSocketServer();
    server.on('connection', function (socket) {
        socket.on(INTEGRANT_INFO, function (data) {
            let id = data.childId;
            let n = socket_cp_hash_1.cpHash[id];
            handleIntegrantInfo(data, n, socket);
        });
        socket.on(FATAL, function (msg) {
            let id = msg.childId;
            let n = socket_cp_hash_1.cpHash[id];
            socket.emit(FATAL_MESSAGE_RECEIVED, true);
            handle_fatal_message_1.handleFatalMessage(msg.data, n, socket);
        });
        socket.on(TABLE_DATA, function (msg) {
            let id = msg.childId;
            let n = socket_cp_hash_1.cpHash[id];
            handleTableData(n, msg.data, socket);
        });
        socket.on(LOG_RESULT, function (msg, cb) {
            let id = msg.childId;
            let n = socket_cp_hash_1.cpHash[id];
            log_test_result_1.logTestResult(msg, n, socket);
            cb(null);
        });
        socket.on(BROWSER_FINISHED, function (msg, cb) {
            let id = String(msg.childId).trim();
            let exitCode = Number(String(msg.exitCode).trim());
            let n = socket_cp_hash_1.cpHash[id];
            n.sumanBrowserExitCode = exitCode;
            n.kill('SIGTERM');
            setTimeout(function () {
                if (!n.hasExited) {
                    n.kill('SIGINT');
                    setTimeout(function () {
                        !n.hasExited && n.kill('SIGKILL');
                    }, 1000);
                }
            }, 1000);
            cb(null);
        });
    });
    delete process.env.SUMAN_EXTRANEOUS_EXECUTABLE;
    process.nextTick(function () {
        const args = fnArgs(runOnce);
        const ret = runOnce.apply(null, integrant_injector_1.default(args, null));
        if (ret.dependencies) {
            if (su.isObject(ret.dependencies)) {
                runnerObj.depContainerObj = ret.dependencies;
            }
            else {
                throw new Error(' => suman.once.pre.js file does not export an object with a property called "dependencies".');
            }
        }
        else {
            _suman.log.error('warning, no dependencies object exported from suman.once.pre.js file => \n' +
                'here is the returned contents =>\n', util.inspect(ret));
        }
        rb.emit(String(suman_events_1.events.RUNNER_ASCII_LOGO), ascii.suman_runner);
        let fn;
        if (IS_SUMAN_SINGLE_PROCESS) {
            fn = makeSingleProcess(runnerObj, messages, beforeExitRunOncePost, exit);
        }
        else if (sumanOpts.containerize) {
            fn = makeContainerize(runnerObj, messages, beforeExitRunOncePost, exit);
        }
        else if (sumanOpts.browser) {
            fn = makeHandleBrowserProcesses(runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, exit);
        }
        else if (runObj) {
            fn = handle_multiple_processes_1.makeHandleMultipleProcesses(runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, exit);
        }
        else {
            throw new Error('Suman implementation error => Switch fallthrough, please report.');
        }
        fn(runObj);
    });
};
