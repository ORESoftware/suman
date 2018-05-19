'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const cp = require('child_process');
const path = require('path');
const EE = require('events');
const merge = require('lodash.merge');
const shuffle = require('lodash.shuffle');
const suman_events_1 = require("suman-events");
const su = require("suman-utils");
const async = require("async");
const noFilesFoundError = require('../helpers/no-files-found-error');
const chalk = require("chalk");
const _suman = global.__suman = (global.__suman || {});
const coverage_reporting_1 = require("./coverage-reporting");
const { constants } = require('../../config/suman-constants');
const queues_1 = require("./shared/queues");
const rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
exports.makeOnExitFn = function (runnerObj, tableRows, messages, forkedCPs, beforeExitRunOncePost, makeExit, runQueue) {
    return function (n, gd, cb) {
        let weHaveBailed = function (code) {
            if (code > 0 && _suman.sumanOpts.bail) {
                return runnerObj.bailed = true;
            }
        };
        let allDone = function (q) {
            return q && q.length() < 1 && q.running() < 1;
        };
        return function (code, signal) {
            n.hasExitted = n.exited = true;
            cb(null);
            n.dateEndedMillis = gd.endDate = Date.now();
            n.sumanExitCode = gd.sumanExitCode = code = (n.sumanBrowserExitCode || code);
            n.removeAllListeners();
            const sumanOpts = _suman.sumanOpts;
            const transpileQueue = queues_1.getTranspileQueue();
            rb.emit(String(suman_events_1.events.TEST_FILE_CHILD_PROCESS_EXITED), {
                testPath: n.testPath,
                exitCode: code
            });
            if (su.isSumanDebug() || su.vgt(5)) {
                _suman.log.info(chalk.black.bgYellow(`process given by => '${n.shortTestPath}' exited with code: ${code} `));
            }
            if (su.isSumanDebug()) {
                _suman.timeOfMostRecentExit = Date.now();
            }
            const originalExitCode = code;
            if (n.expectedExitCode !== undefined) {
                if (code === n.expectedExitCode) {
                    code = 0;
                }
            }
            runnerObj.doneCount++;
            messages.push({ code, signal });
            tableRows[n.shortTestPath].actualExitCode = n.expectedExitCode !== undefined ?
                (n.expectedExitCode + '/' + originalExitCode) : originalExitCode;
            if (weHaveBailed(code) || (allDone(runQueue) && allDone(transpileQueue))) {
                if (runnerObj.bailed) {
                    runQueue.kill();
                    transpileQueue.kill();
                    console.log('\n');
                    _suman.log.error(chalk.magenta('We have ' + chalk.red.bold('bailed') +
                        ' the test runner because a child process experienced an error and exitted with a non-zero code.'));
                    _suman.log.error(chalk.magenta('Since we have bailed, Suman will send a SIGTERM signal ' +
                        'to any outstanding child processes.'));
                    forkedCPs.forEach(function (n) {
                        n.kill('SIGTERM');
                        setTimeout(function () {
                            n.kill('SIGKILL');
                        }, 3000);
                    });
                }
                else {
                    if (sumanOpts.verbosity > 4) {
                        console.log('\n');
                        _suman.log.info(chalk.gray.bold.underline(' All scheduled child processes have exited.'));
                        console.log('\n');
                    }
                }
                runnerObj.endTime = Date.now();
                runnerObj.listening = false;
                const onTAPOutputComplete = function () {
                    const tasks = [
                        beforeExitRunOncePost,
                        coverage_reporting_1.handleTestCoverageReporting
                    ];
                    async.parallel(tasks, function (err) {
                        err && _suman.log.error(err.stack || err);
                        makeExit(messages, {
                            total: runnerObj.endTime - _suman.startTime,
                            runner: runnerObj.endTime - runnerObj.startTime
                        });
                    });
                };
                if ('tapOutputIsComplete' in n) {
                    if (n.tapOutputIsComplete === true) {
                        process.nextTick(onTAPOutputComplete);
                    }
                    else {
                        n.once('tap-output-is-complete', onTAPOutputComplete);
                    }
                }
                else {
                    process.nextTick(onTAPOutputComplete);
                }
            }
        };
    };
};
