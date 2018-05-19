'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const cp = require("child_process");
const path = require("path");
const EE = require("events");
const merge = require('lodash.merge');
const shuffle = require('lodash.shuffle');
const suman_events_1 = require("suman-events");
const suman_utils_1 = require("suman-utils");
const async = require("async");
const noFilesFoundError = require('../helpers/no-files-found-error');
const chalk = require("chalk");
const _suman = global.__suman = (global.__suman || {});
const ru = require("./runner-utils");
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const prepend_transform_1 = require("prepend-transform");
exports.makeContainerize = function (runnerObj, tableRows, messages, forkedCPs, handleMessage, beforeExitRunOncePost, makeExit) {
    return function (runObj) {
        _suman.startDateMillis = Date.now();
        const { sumanOpts, sumanConfig, maxProcs, projectRoot, userArgs: args } = _suman;
        const waitForAllTranformsToFinish = true;
        let failedTestObjects = [];
        let queuedTestObjects = [];
        const transpileQueue = async.queue(function (task, cb) {
            task(function (err, file, shortFile, stdout, pathFromProjecRoot) {
                setImmediate(cb);
                if (err) {
                    _suman.log.error('transpile error => ', suman_utils_1.default.getCleanErrorString(err));
                    failedTestObjects.push({ err, file, shortFile, stdout, pathFromProjecRoot });
                }
                else {
                    queuedTestObjects.push({ file, shortFile, stdout, pathFromProjecRoot });
                }
            });
        }, 4);
        transpileQueue.drain = function () {
            _suman.log.info('all transforms complete, beginning to run first set of tests.');
            const p = path.resolve(__dirname + '/../dockerize/make-dockerized-tests.sh');
            const files = queuedTestObjects.map(function (v) {
                if (String(v.pathFromProjecRoot).startsWith('/')) {
                    return String(v.pathFromProjecRoot).slice(1);
                }
                return v.pathFromProjecRoot;
            });
            console.log('short files => ', files);
            const filesStr = files.join(' ');
            console.log('short filesStr => ', filesStr);
            const k = cp.spawn(p, [filesStr, '--no-transpile']);
            k.stdout.pipe(process.stdout);
            k.stderr.pipe(process.stderr);
            k.once('exit', function (code) {
                console.log('containerized tests exitted with code => ', code);
                process.exit(code);
            });
        };
        if (sumanOpts.$useTAPOutput) {
            if (sumanOpts.verbosity > 7) {
                _suman.log.info(chalk.gray.bold('Suman runner is expecting TAP output from Node.js child processes ' +
                    'and will not be listening for IPC messages.'));
            }
        }
        let files = runObj.files;
        resultBroadcaster.emit(String(suman_events_1.events.RUNNER_STARTED), files.length);
        if (_suman.sumanOpts.rand) {
            files = shuffle(files);
        }
        runnerObj.startTime = Date.now();
        const fileObjArray = suman_utils_1.default.removeSharedRootPath(files);
        const sumanEnv = Object.assign({}, process.env, {
            SUMAN_CONFIG: JSON.stringify(sumanConfig),
            SUMAN_OPTS: JSON.stringify(sumanOpts),
            SUMAN_RUNNER: 'yes',
            SUMAN_RUN_ID: _suman.runId,
            SUMAN_RUNNER_TIMESTAMP: _suman.timestamp,
            NPM_COLORS: process.env.NPM_COLORS || (sumanOpts.no_color ? 'no' : 'yes')
        });
        if (_suman.socketServerPort > 0) {
            sumanEnv['SUMAN_SOCKETIO_SERVER_PORT'] = _suman.socketServerPort;
        }
        fileObjArray.forEach(function (fileShortAndFull) {
            const file = fileShortAndFull[0];
            const shortFile = fileShortAndFull[1];
            console.log('fileShortAndFull', fileShortAndFull);
            const pathFromRoot = fileShortAndFull[2];
            let basename = file.length > 28 ? ' ' + String(file).substring(Math.max(0, file.length - 28)) + ' ' : file;
            const m = String(basename).match(/\//g);
            if (m && m.length > 1) {
                const arr = String(basename).split('');
                let i = 0;
                while (arr[i] !== '/') {
                    arr.shift();
                }
                basename = arr.join('');
            }
            tableRows[shortFile] = {
                actualExitCode: null,
                shortFilePath: shortFile,
                tableData: null,
                defaultTableData: {
                    SUITES_DESIGNATOR: basename
                }
            };
            const tr = ru.findPathOfTransformDotSh(file);
            if (tr) {
                transpileQueue.push(function (cb) {
                    suman_utils_1.default.makePathExecutable(tr, function (err) {
                        if (err) {
                            return cb(err);
                        }
                        let k = cp.spawn(tr, [], {
                            cwd: projectRoot,
                            env: Object.assign({}, process.env, {
                                SUMAN_TEST_PATHS: JSON.stringify([file]),
                                SUMAN_CHILD_TEST_PATH: file
                            })
                        });
                        k.once('error', cb);
                        k.stderr.setEncoding('utf8');
                        k.stdout.setEncoding('utf8');
                        if (sumanOpts.inherit_stdio || process.env.SUMAN_INHERIT_STDIO === 'yes') {
                            let onError = function (e) {
                                console.error('\n', suman_utils_1.default.getCleanErrorString(e), '\n');
                            };
                            k.stderr.pipe(prepend_transform_1.pt(`${chalk.red('=> transform process stderr => ')} ${file}\n`, { omitWhitespace: true }))
                                .on('error', onError).pipe(process.stderr).on('error', onError);
                            k.stdout.pipe(prepend_transform_1.pt(` => transform process stdout => ${file}\n`))
                                .on('error', onError).pipe(process.stdout).on('error', onError);
                        }
                        let stdout = '';
                        k.stdout.on('data', function (data) {
                            stdout += data;
                        });
                        k.once('close', function (code) {
                            if (code > 0) {
                                cb(new Error(`the @transform.sh process, for file ${file},\nexitted with non-zero exit code. :(
                   \n To see the stderr, use --inherit-stdio.`));
                            }
                            else {
                                cb(null, file, shortFile, stdout, pathFromRoot);
                            }
                        });
                    });
                });
            }
            else {
                transpileQueue.unshift(function (cb) {
                    setImmediate(function () {
                        cb(null, file, shortFile, '', pathFromRoot);
                    });
                });
            }
        });
    };
};
