'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const fs = require("fs");
const path = require("path");
const util = require("util");
const assert = require("assert");
const EE = require("events");
const chalk = require("chalk");
const includes = require('lodash.includes');
const async = require("async");
const JSONStdio = require("json-stdio");
const _suman = global.__suman = (global.__suman || {});
const su = require("suman-utils");
const { constants } = require('../../config/suman-constants');
const { events } = require('suman-events');
const rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const writeStdoutToSumanShell = JSONStdio.initLogToStdout(su.constants.JSON_STDIO_SUMAN_SHELL);
exports.getFilePaths = function (dirs, cb) {
    const { projectRoot, sumanOpts } = _suman;
    const isForce = sumanOpts.force;
    const isForceMatch = sumanOpts.force_match;
    const matchesAny = _suman.sumanMatchesAny;
    const matchesNone = _suman.sumanMatchesNone;
    const matchesAll = _suman.sumanMatchesAll;
    assert(Array.isArray(matchesAll), ' => Suman internal error => matchesAll is not defined as array type.');
    assert(Array.isArray(matchesNone), ' => Suman internal error => matchesNone is not defined as array type.');
    assert(Array.isArray(matchesAll), ' => Suman internal error => matchesAll is not defined as array type.');
    matchesNone.push(new RegExp(_suman.sumanHelperDirRoot));
    const isFindOnly = Boolean(sumanOpts.find_only);
    let files = [];
    const filesThatDidNotMatch = [];
    let nonJSFile = false;
    const doesMatchAll = function (filename) {
        if (isForceMatch) {
            return true;
        }
        return matchesAll.every(function (regex) {
            const val = String(filename).match(regex);
            if (!val) {
                filesThatDidNotMatch.push({
                    filename: filename,
                    regexType: 'matchAll',
                    regex: 'The filename did not match the following regex' +
                        ' and therefore was excluded => ' + [regex],
                });
            }
            return val;
        });
    };
    const doesMatchAny = function (filename) {
        if (isForceMatch) {
            return true;
        }
        const val = !matchesAny.every(function (regex) {
            return !String(filename).match(regex);
        });
        if (!val) {
            filesThatDidNotMatch.push({
                filename: filename,
                regexType: 'matchAny',
                message: 'The filename did not match any of the regex(es)',
                regexes: matchesAny.map((r) => String(r).slice(1, -1))
            });
        }
        return val;
    };
    const doesMatchNone = function (filename) {
        if (isForceMatch) {
            return true;
        }
        return matchesNone.every(function (r) {
            const val = !String(filename).match(r);
            if (!val) {
                filesThatDidNotMatch.push({
                    filename: filename,
                    regexType: 'matchNone',
                    message: 'The filename matched the included regex and was therefore excluded.',
                    regex: r,
                });
            }
            return val;
        });
    };
    (function runDirs(dirs, count, cb) {
        async.eachLimit(dirs, 5, function (dir, cb) {
            const _doesMatchNone = doesMatchNone(dir);
            if (!_doesMatchNone) {
                rb.emit(String(events.FILENAME_DOES_NOT_MATCH_NONE), dir);
                return process.nextTick(cb);
            }
            if (!path.isAbsolute(dir)) {
                dir = path.resolve(process.cwd() + '/' + dir);
            }
            fs.stat(dir, function (err, stats) {
                if (err) {
                    _suman.log.warning(`warning: possibly a symlink (symlinks not yet supported) => "${err.message}".`);
                    return cb();
                }
                const countIsGreaterThanMaxDepth = (count > sumanOpts.max_depth);
                const isStartingToBeRecursive = (count > 0 && !sumanOpts.recursive);
                if (stats.isDirectory() && !countIsGreaterThanMaxDepth && !isStartingToBeRecursive) {
                    fs.readdir(dir, function (err, items) {
                        if (err) {
                            console.error('\n', ' ', chalk.bgBlack.yellow(' => Suman presumes you wanted to run tests with/within the ' +
                                'following path => '), '\n ', chalk.bgBlack.cyan(' => "' + dir + '" '));
                            console.error(' ', chalk.magenta.bold(' => But this file or directory cannot be found.'));
                            console.error('\n', chalk.magenta(err.stack || err), '\n\n');
                            return cb(err);
                        }
                        let mappedItems = items.map(i => path.resolve(dir + '/' + i));
                        runDirs(mappedItems, ++count, cb);
                    });
                }
                else if (stats.isFile()) {
                    const _doesMatchAny = doesMatchAny(dir);
                    const _doesMatchNone = doesMatchNone(dir);
                    const _doesMatchAll = doesMatchAll(dir);
                    if (!_doesMatchAny) {
                        rb.emit(String(events.FILENAME_DOES_NOT_MATCH_ANY), dir);
                        return process.nextTick(cb);
                    }
                    if (!_doesMatchNone) {
                        rb.emit(String(events.FILENAME_DOES_NOT_MATCH_NONE), dir);
                        return process.nextTick(cb);
                    }
                    if (!_doesMatchAll) {
                        rb.emit(String(events.FILENAME_DOES_NOT_MATCH_ALL), dir);
                        return process.nextTick(cb);
                    }
                    const baseName = path.basename(dir);
                    if (path.extname(baseName) !== '.js') {
                        nonJSFile = true;
                        rb.emit(String(events.FILE_IS_NOT_DOT_JS), dir);
                    }
                    const file = path.resolve(dir);
                    if (!sumanOpts.allow_duplicate_tests && includes(files, file)) {
                        _suman.log.warning(chalk.magenta('warning => \n => The following filepath was requested to be run more' +
                            ' than once, Suman will only run files once per run! =>'), '\n', file, '\n\n ' +
                            chalk.underline(' => To run files more than once in the same run, use "--allow-duplicate-tests"'), '\n');
                    }
                    else {
                        isFindOnly && writeStdoutToSumanShell({ file });
                        files.push(file);
                    }
                    process.nextTick(cb);
                }
                else {
                    const msg = [
                        '\n',
                        ' => Suman message => You may have wanted to run tests in the following path:',
                        chalk.cyan(String(dir)),
                        '...but it is either a folder or is not a .js (or accepted file type) file, or it\'s a symlink',
                        'if you want to run *subfolders* you shoud use the recursive option -r',
                        '...be sure to only run files that constitute Suman tests, to enforce this we',
                        'recommend a naming convention to use with Suman tests, see: sumanjs.org\n\n'
                    ]
                        .filter(i => i).join('\n');
                    rb.emit(String(events.RUNNER_HIT_DIRECTORY_BUT_NOT_RECURSIVE), msg);
                    process.nextTick(cb);
                }
            });
        }, cb);
    })(dirs, 0, function (err) {
        if (err) {
            console.error('\n');
            _suman.log.error(chalk.red.bold('Error finding runnable paths:'));
            _suman.log.error(err.stack || util.inspect(err));
            return process.nextTick(cb, err);
        }
        if (sumanOpts.transpile && !sumanOpts.useBabelRegister) {
            files = files.map(function (item) {
                return su.mapToTargetDir(item).targetPath;
            });
        }
        filesThatDidNotMatch.forEach(function (val) {
            console.log('\n');
            _suman.log.info(chalk.bgBlack.yellow(' A file in a relevant directory ' +
                'did not match your regular expressions => '), '\n', util.inspect(val));
        });
        console.log();
        console.error();
        process.nextTick(cb, null, {
            files,
            nonJSFile,
            filesThatDidNotMatch
        });
    });
};
exports.findFilesToRun = exports.getFilePaths;
