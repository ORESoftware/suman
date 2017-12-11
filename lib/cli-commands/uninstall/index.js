'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var fs = require('fs');
var cp = require('child_process');
var path = require('path');
var os = require('os');
var async = require('async');
var colors = require('colors');
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var su = require('suman-utils');
exports.run = function (opts) {
    var force = opts.force;
    var fforce = opts.fforce;
    var removeBabel = opts.removeBabel;
    var cwd = process.cwd();
    var root = su.findProjectRoot(cwd);
    try {
        require(path.resolve(cwd + '/package.json'));
    }
    catch (err) {
        console.log(' => Suman message => there is no package.json file in your working directory.');
        console.log(' => Perhaps you are in the wrong directory?');
        console.log(' => At the moment, it looks like the root of your project is here: ' + root);
        console.log(' => To use this value as project root use the --force option, otherwise cd into the correct directory and reissue the ' +
            '"$ suman --uninstall" command.');
        return;
    }
    if (!force) {
        _suman.logWarning(chalk.red('warning => you are about to uninstall suman from your local project.'));
        if (removeBabel) {
            console.log(' => Note that you will also be removing all Babel deps used by Suman, because you used the --remove-babel options.');
        }
        console.log('\n', '=> Suman warning => This routine will delete the following items:');
        console.log(' => suman/ and all its contents');
        console.log(' => test-target/ and all its contents');
        console.log(' => suman.conf.js');
        console.log('\n', chalk.bgRed('To proceed please use the --force option.'));
        return;
    }
    console.log(' => Suman message => Uninstalling suman locally...using "npm uninstall --save-dev --save suman"...');
    async.series([
        function (cb) {
            if (opts.removeBabel) {
                var items = ['uninstall',
                    'babel-cli',
                    'babel-core',
                    'babel-loader',
                    'babel-polyfill',
                    'babel-runtime',
                    'babel-register',
                    'babel-plugin-transform-runtime',
                    'babel-preset-es2015',
                    'babel-preset-es2016',
                    'babel-preset-react',
                    'babel-preset-stage-0',
                    'babel-preset-stage-1',
                    'babel-preset-stage-2',
                    'babel-preset-stage-3'];
                var s = cp.spawn('npm', items, {
                    cwd: cwd
                });
                s.stdout.on('data', function (data) {
                    console.log(String(data));
                });
                s.stderr.on('data', function (data) {
                    console.error(String(data));
                });
                s.on('close', function (code) {
                    if (code > 0) {
                        console.error(' => Suman installation error => NPM install script exited with non-zero code: ' + code);
                    }
                    cb(null);
                });
            }
            else {
                process.nextTick(cb);
            }
        },
        function (cb) {
            async.parallel([
                function (cb) {
                    if (os.platform() === 'win32') {
                        console.log(' => Suman message => This may take a while if you are on Windows, be patient.');
                        cp.exec('cd ' + cwd + ' && npm uninstall --save-dev --save suman', function (err, stdout, stderr) {
                            if (err) {
                                console.error(' => Suman installation error => ' + err.stack);
                            }
                            if (String(stderr).match(/error/i)) {
                                console.error(' => Suman installation error => ' + stderr);
                            }
                            if (String(stdout).match(/error/i)) {
                                console.error(' => Suman installation error => ' + stdout);
                            }
                            console.log(stdout);
                            cb(null);
                        });
                    }
                    else {
                        var s = cp.spawn('npm', ['uninstall', '--save-dev', '--save', 'suman'], {
                            cwd: cwd
                        });
                        s.stdout.on('data', function (data) {
                            console.log(String(data));
                        });
                        s.stderr.on('data', function (data) {
                            console.error(String(data));
                        });
                        s.on('close', function (code) {
                            if (code > 0) {
                                console.error(' => Suman installation error => NPM install script exited with non-zero code: ' + code);
                            }
                            cb(null);
                        });
                    }
                },
                function (cb) {
                    cp.exec('rm -rf suman', function (err, stdout, stderr) {
                        if (err) {
                            console.error(err.stack);
                        }
                        if (String(stdout).match(/error/i)) {
                            console.error(stdout);
                        }
                        if (String(stderr).match(/error/i)) {
                            console.error(stderr);
                        }
                        cb(null);
                    });
                },
                function (cb) {
                    cp.exec('rm -rf test-target', function (err, stdout, stderr) {
                        if (err) {
                            console.error(err.stack);
                        }
                        if (String(stdout).match(/error/i)) {
                            console.error(stdout);
                        }
                        if (String(stderr).match(/error/i)) {
                            console.error(stderr);
                        }
                        cb(null);
                    });
                },
                function (cb) {
                    fs.unlink(cwd + '/suman.conf.js', function (err) {
                        if (err) {
                            console.error(err.stack);
                        }
                        cb(null);
                    });
                }
            ], cb);
        }
    ], function (err) {
        if (err) {
            console.error('=> Suman uninstall error => ' + err.stack);
            process.exit(1);
        }
        else {
            console.log('\n' + chalk.bgGreen.black(' => Suman has been successfully uninstalled.') + '\n');
            process.exit(0);
        }
    });
};
