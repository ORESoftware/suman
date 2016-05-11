'use strict';

/**
 * Created by denman on 1/3/2016.
 */

var Test = require('../../../../lib').init(module, 'suman.conf.js');

Test.describe('A describe', { parallel: true }, function () {

    this.after(function (done) {
        done();
    });

    this.describe('B describe', function () {

        this.after(function (done) {
            done();
        });

        this.it('b1 test', { parallel: false }, function (t) {});

        this.it('b2 test', function () {});

        this.it('b3 test', function () {});

        this.it('b4 test', function () {});

        this.describe('C', function () {
            this.after(function (done) {
                done();
            });
        });
    });

    this.describe('D describe', function () {

        this.after(function (done) {
            done();
        });

        this.it('d1 test', function () {});

        this.it('d2 test', function () {});

        this.describe('E', function () {

            this.it('e1 test', function () {});

            this.it('e2 test', function () {});

            this.it('e3 test', function () {});

            this.after(function (done) {
                done();
            });
        });
    });

    this.describe('F', function () {
        this.after(function (done) {
            done();
        });

        this.describe('G', function () {

            this.it('mmm2', { parallel: false }, function (t, done) {
                done();
            });

            this.after(function (done) {
                done();
            });
        });
    });

    this.describe('moodle', { parallel: false }, function () {

        this.after(function (done) {

            done();
        });

        this.it('mmm1', { parallel: false }, function (t, done) {
            done();
        });

        this.after(function (done) {
            done();
        });
    });

    this.it('a test', { parallel: false }, function (t, done) {
        done();
    });

    this.after(function (done) {
        done();
    });

    this.after(function (done) {
        done();
    });
});