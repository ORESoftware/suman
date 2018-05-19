'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const util = require("util");
const EE = require("events");
const async = require("async");
const chalk = require("chalk");
const _suman = global.__suman = (global.__suman || {});
const suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
const { constants } = require('../config/suman-constants');
const handle_suman_shutdown_1 = require("./helpers/handle-suman-shutdown");
exports.run = function (files) {
    let fileCount = chalk.bold.underline(String(files.length));
    let boldTitle = chalk.bold('single process mode');
    _suman.log.info(chalk.magenta(`Suman will run the following ${fileCount} files in ${boldTitle}:`));
    files.forEach(function (f, index) {
        _suman.log.info(`[${index + 1}]`, chalk.gray(f[0]));
    });
    console.log();
    files.forEach(function (f) {
        require(f[0]);
    });
    const { tsq, tsrq, sumanOpts } = _suman;
    if (sumanOpts.dry_run) {
        _suman.log.warning('Suman is using the "--dry-run" argument, and is shutting down without actually running the tests.');
        return handle_suman_shutdown_1.shutdownProcess();
    }
    if (!_suman.sumanInitCalled) {
        throw new Error('Looks like none of your files contains a Suman test.');
    }
    tsq.drain = function () {
        if (tsrq.idle()) {
            _suman.log.verygood('We are done running all tests in single process mode.');
            handle_suman_shutdown_1.shutdownProcess();
        }
    };
    _suman.log.good('Resuming test registration for Suman single process mode.');
    tsrq.resume();
};
exports.run2 = function (files) {
    _suman.log.info(chalk.magenta('suman will run the following files in single process mode:'));
    _suman.log.info(util.inspect(files.map(v => v[0])));
    async.eachLimit(files, 5, function (f, cb) {
        const fullPath = f[0];
        const shortenedPath = f[1];
        console.log('\n');
        _suman.log.info('is now running test with filename => "' + shortenedPath + '"', '\n');
        suiteResultEmitter.once('suman-test-file-complete', function () {
            cb(null);
        });
        require(fullPath);
    }, function (err) {
        if (err) {
            console.error(err.stack || err || 'no error passed to error handler.');
            process.exit(1);
        }
        else {
            console.log('\n');
            _suman.log.info('SUMAN_SINGLE_PROCESS run is now complete.');
            console.log('\n');
            _suman.log.info('Time required for all tests in single process => ', Date.now() - _suman.sumanSingleProcessStartTime);
            process.exit(0);
        }
    });
};
