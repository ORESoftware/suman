/**
 * Created by denman on 1/1/2016.
 */


var debug = require('debug')('suman:test');
var Test = require('../../lib').Test(module, 'suman.conf.js');

Test.describe('gggg', function () {

    this.beforeEach(function (t,done) {

        done();
    });

    this.after(function (done) {

        debug('5');
        done();
    });

    this.after(function (done) {
        debug('6');
        done();
    });

    this.describe(function () {

        this.after(function (done) {
            debug('3');
            done();
        });

        this.beforeEach(function (t,done) {

            done();
        });


        this.describe('moodle', {
            parallel: false
        }, function () {

            this.after(function (done) {
                debug('1');
                done();
            });

            this.beforeEach(function (t,done) {

                done();
            });


            this.it('mmm1', {parallel: false}, function (t,done) {

                done();

            });

            this.beforeEach(function (t,done) {

                done();
            });

            this.afterEach(function (t,done) {

                done();
            });


            this.after(function (done) {
                debug('2');
                done();
            });


        });

        this.after(function (done) {
            debug('4');
            done();
        });


    });

    this.after(function (done) {
        debug('7');
        done();
    });
});