"use strict";
exports.__esModule = true;
var suman_1 = require("suman");
var Test = suman_1["default"].init(module);
Test.create(function (it) {
    it('passes', function (t) {
        // t.skip();
        throw new Error('whole me 1');
    });
    it('fails', function (t) {
        // t.skip();
        throw new Error('whole me 2');
    });
});