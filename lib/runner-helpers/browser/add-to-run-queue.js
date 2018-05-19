'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const path = require("path");
const EE = require("events");
const chalk = require("chalk");
const su = require("suman-utils");
const suman_events_1 = require("suman-events");
const _suman = global.__suman = (global.__suman || {});
const prepend_transform_1 = require("prepend-transform");
const uuid = require("uuid");
const suman_constants_1 = require("../../../config/suman-constants");
const runChildPath = require.resolve(__dirname + '/../run-child.js');
const rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
exports.makeAddToRunQueue = function (runnerObj, args, runQueue, projectRoot, cpHash, forkedCPs, onExitFn) {
    const { sumanOpts, sumanConfig, maxProcs } = _suman;
    const isStdoutSilent = sumanOpts.stdout_silent || sumanOpts.silent;
    const isStderrSilent = sumanOpts.stderr_silent || sumanOpts.silent;
    const debugChildren = sumanOpts.debug_child || sumanOpts.inspect_child;
    const inheritRunStdio = debugChildren || sumanOpts.inherit_stdio ||
        sumanOpts.inherit_all_stdio || process.env.SUMAN_INHERIT_STDIO === 'yes';
    let childId = 1;
    const cl = require('chrome-launcher');
    const sumanEnv = Object.assign({}, process.env, {
        SUMAN_RUN_CHILD_STATIC_PATH: runChildPath,
        SUMAN_CONFIG: JSON.stringify(sumanConfig),
        SUMAN_OPTS: JSON.stringify(sumanOpts),
        SUMAN_RUNNER: 'yes',
        SUMAN_PROJECT_ROOT: projectRoot,
        SUMAN_RUN_ID: _suman.runId,
        SUMAN_RUNNER_TIMESTAMP: _suman.timestamp,
        NPM_COLORS: process.env.NPM_COLORS || (sumanOpts.no_color ? 'no' : 'yes'),
        SUMAN_SOCKETIO_SERVER_PORT: _suman.socketServerPort > 0 ? _suman.socketServerPort : undefined
    });
    const port = _suman.socketServerPort;
    return function (file, shortFile, stdout, gd) {
        runQueue.push(function (cb) {
            if (runnerObj.bailed) {
                if (sumanOpts.verbosity > 4)
                    _suman.log.info('"--bailed" option was passed and was tripped, no more child processes will be forked.');
                return;
            }
            const argz = JSON.parse(JSON.stringify(args));
            let n, hashbang = false;
            const extname = path.extname(shortFile);
            let $childId = childId++;
            let childUuid = uuid.v4();
            const inherit = sumanOpts.$forceInheritStdio ? 'inherit' : '';
            if (inherit) {
                _suman.log.info('we are inheriting stdio of child, because of sumanception.');
            }
            const testData = JSON.stringify({
                childId: $childId
            });
            cl.launch({
                startingUrl: `http://localhost:${port}/suman_testing?data=${testData}`,
                chromeFlags: ['--auto-open-devtools-for-tabs', '--debug-devtools']
            })
                .then(c => {
                const n = c.instance.chrome;
                _suman.log.info(`Chrome debugging port running on ${c.port}.\n`);
                cpHash[String($childId)] = n;
                if (!_suman.weAreDebugging) {
                    n.to = setTimeout(function () {
                        _suman.log.error(`Suman killed a child process because it timed out: '${n.fileName || n.filename}'.`);
                        n.kill('SIGINT');
                        setTimeout(function () {
                            n.kill('SIGKILL');
                        }, 8000);
                    }, suman_constants_1.constants.DEFAULT_CHILD_PROCESS_TIMEOUT);
                }
                n.testPath = file;
                n.shortTestPath = shortFile;
                forkedCPs.push(n);
                n.on('message', function (msg) {
                    _suman.log.error('Warning - Suman browser runner does not handle standard Node.js IPC messages.');
                });
                n.on('error', function (err) {
                    _suman.log.error('error spawning child process => ', err.stack || err);
                    if (hashbang) {
                        _suman.log.error('\n');
                        _suman.log.error(' => The supposed test script file with the following path may not have a hashbang => ');
                        _suman.log.error(chalk.magenta.bold(file));
                        _suman.log.error(' => A hashbang is necessary for non-.js files and when there is no accompanying @run.sh file.');
                        _suman.log.error(' => Without a hashbang, Suman (and your OS) will not know how to run the file.');
                        _suman.log.error(' => See sumanjs.org for more information.');
                    }
                });
                if (n.stdio && n.stdout && n.stderr) {
                    if (inherit) {
                        _suman.log.error('n.stdio is defined even though we are in sumanception territory.');
                    }
                    n.stdout.setEncoding('utf8');
                    n.stderr.setEncoding('utf8');
                    if (inheritRunStdio) {
                        let onError = function (e) {
                            _suman.log.error('\n', su.getCleanErrorString(e), '\n');
                        };
                        n.stdout.pipe(prepend_transform_1.default(chalk.cyan(' [suman child stdout] ')))
                            .once('error', onError).pipe(process.stdout);
                        n.stderr.pipe(prepend_transform_1.default(chalk.red.bold(' [suman child stderr] '), { omitWhitespace: true }))
                            .once('error', onError).pipe(process.stderr);
                    }
                    n.stdio[2].setEncoding('utf-8');
                    n.stdio[2].on('data', function (data) {
                        const d = String(data).split('\n').filter(function (line) {
                            return String(line).length;
                        })
                            .map(function (line) {
                            return '[' + n.shortTestPath + '] ' + line;
                        })
                            .join('\n');
                        _suman.sumanStderrStream.write('\n' + d);
                        if (_suman.weAreDebugging) {
                            _suman.log.info('pid => ', n.pid, 'stderr => ', d);
                        }
                    });
                }
                else {
                    if (su.vgt(2)) {
                        _suman.log.warning('stdio object not available for child process.');
                    }
                }
                rb.emit(String(suman_events_1.events.RUNNER_SAYS_FILE_HAS_JUST_STARTED_RUNNING), file);
                n.dateStartedMillis = gd.startDate = Date.now();
                n.once('exit', onExitFn(n, gd, cb));
            });
        });
    };
};
