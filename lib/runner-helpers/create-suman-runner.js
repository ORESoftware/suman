'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var fs = require("fs");
var path = require("path");
var assert = require("assert");
var chalk = require("chalk");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var cwd = process.cwd();
var socketio_server_1 = require("./socketio-server");
exports.createRunner = function (obj) {
    var runObj = obj.runObj;
    var strmPath = _suman.sumanRunnerStderrStreamPath = path.resolve(_suman.sumanHelperDirRoot + '/logs/runner-debug.log');
    var strm = _suman.sumanStderrStream = fs.createWriteStream(strmPath);
    strm.write('\n\n### Suman runner start ###\n\n');
    strm.write('Beginning of run at ' + Date.now() + ' = [' + new Date() + ']' + '\n');
    strm.write('Command issued from the following directory "' + cwd + '"\n');
    strm.write('Command = ' + JSON.stringify(process.argv) + '\n');
    var oncePath = path.resolve(_suman.sumanHelperDirRoot + '/suman.once.pre.js');
    var runOnce;
    try {
        runOnce = require(oncePath);
        assert(typeof runOnce === 'function', 'runOnce is not a function.');
    }
    catch (err) {
        if (err instanceof assert.AssertionError) {
            console.error('Your suman.once.js module is defined at the root of your project,\n' +
                'but it does not export a function and/or return an object from that function.');
            throw err;
        }
    }
    runOnce = runOnce || function () {
        return {};
    };
    var orderPath = path.resolve(_suman.sumanHelperDirRoot + '/suman.order.js');
    var fn, order = null;
    try {
        fn = require(orderPath);
        if (fn) {
            order = fn();
        }
    }
    catch (err) {
        if (fn) {
            throw new Error(' => Your suman.order.js file needs to export a function.');
        }
        else if (!_suman.usingDefaultConfig || su.isSumanDebug()) {
            _suman.logWarning(chalk.magenta('warning => Your suman.order.js file could not be located,' +
                ' given the following path to your "<suman-helpers-dir>" => ') +
                '\n' + chalk.bgBlack.cyan(_suman.sumanHelperDirRoot));
        }
    }
    if (order) {
        require('./validate-suman.order.js').run(order);
    }
    socketio_server_1.initializeSocketServer(function (err, port) {
        assert(Number.isInteger(port), 'port must be an integer');
        _suman.socketServerPort = port;
        require('../runner').findTestsAndRunThem(runObj, runOnce, order);
    });
};