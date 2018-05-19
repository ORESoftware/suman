'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const EE = require("events");
const _suman = global.__suman = (global.__suman || {});
const suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
const { constants } = require('../config/suman-constants');
const handle_suman_shutdown_1 = require("./helpers/handle-suman-shutdown");
exports.run = function (testRegistrationQueue, testQueue) {
    testQueue.drain = function () {
        if (testRegistrationQueue.idle()) {
            _suman.log.verygood('we are done with all tests in the browser.');
            handle_suman_shutdown_1.shutdownProcess();
        }
    };
    _suman.log.good('resuming test registration in the browser.');
    testRegistrationQueue.resume();
};
