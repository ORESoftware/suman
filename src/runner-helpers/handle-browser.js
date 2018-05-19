'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const cp = require("child_process");
const path = require("path");
const EE = require("events");
const shuffle = require('lodash.shuffle');
const suman_events_1 = require("suman-events");
const su = require("suman-utils");
const noFilesFoundError = require('../helpers/no-files-found-error');
const chalk = require("chalk");
const _suman = global.__suman = (global.__suman || {});
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const socket_cp_hash_1 = require("./socket-cp-hash");
const { constants } = require('../../config/suman-constants');
const add_to_transpile_queue_1 = require("./browser/add-to-transpile-queue");
const multiple_process_each_on_exit_1 = require("./multiple-process-each-on-exit");
const add_to_run_queue_1 = require("./browser/add-to-run-queue");
const queues_1 = require("./shared/queues");
exports.makeHandleBrowserProcesses = function (runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, makeExit) {
    return function (runObj) {
        const { sumanOpts, sumanConfig, projectRoot } = _suman;
        _suman.startDateMillis = Date.now();
        process.stderr.setMaxListeners(runObj.files.length + 11);
        process.stdout.setMaxListeners(runObj.files.length + 11);
        try {
            require('chrome-launcher');
        }
        catch (err) {
            cp.execSync('npm install chrome-launcher');
        }
        const logsDir = _suman.sumanConfig.logsDir || _suman.sumanHelperDirRoot + '/logs';
        const sumanCPLogs = path.resolve(logsDir + '/runs/');
        const f = path.resolve(sumanCPLogs + '/' + _suman.timestamp + '-' + _suman.runId);
        const args = ['--user-args', sumanOpts.user_args];
        const runQueue = queues_1.makeRunQueue();
        const onExitFn = multiple_process_each_on_exit_1.makeOnExitFn(runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, makeExit, runQueue);
        const runFile = add_to_run_queue_1.makeAddToRunQueue(runnerObj, args, runQueue, projectRoot, socket_cp_hash_1.cpHash, forkedCPs, onExitFn);
        const waitForAllTranformsToFinish = sumanOpts.wait_for_all_transforms;
        if (waitForAllTranformsToFinish) {
            _suman.log.info('waitForAllTranformsToFinish => ', chalk.magenta(waitForAllTranformsToFinish));
        }
        let queuedTestFns = [];
        let failedTransformObjects = [];
        const transpileQueue = queues_1.makeTranspileQueue(failedTransformObjects, runFile, queuedTestFns);
        if (waitForAllTranformsToFinish) {
            transpileQueue.drain = function () {
                _suman.log.info('all transforms complete, beginning to run first set of tests.');
                queuedTestFns.forEach(function (fn) {
                    fn();
                });
            };
        }
        if (sumanOpts.$useTAPOutput) {
            if (sumanOpts.verbosity > 4) {
                _suman.log.info(chalk.gray.bold('Suman runner is expecting TAP output from Node.js child processes ' +
                    'and will not be listening for websocket messages.'));
            }
        }
        let files = runObj.files;
        resultBroadcaster.emit(String(suman_events_1.events.RUNNER_STARTED), files.length);
        if (_suman.sumanOpts.rand) {
            files = shuffle(files);
        }
        runnerObj.startTime = Date.now();
        const fileObjArray = su.removeSharedRootPath(files);
        fileObjArray.forEach(add_to_transpile_queue_1.makeAddToTranspileQueue(f, transpileQueue, tableRows, socket_cp_hash_1.ganttHash, projectRoot));
    };
};
