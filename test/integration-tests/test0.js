/**
 * Created by denman on 1/1/2016.
 */



const suman = require('../../lib/index');

const Test = suman.init(module, {
    integrants: ['smartconnect', 'dolce-vida'],
    interface: 'BDD',
    iocData: createIOCArgs()
});


function createIOCArgs() {

    return {
        roodles: {
            camera: 'man'
        },
        whoa: {
            bob: 'bouche'
        },
        cherry: {
            'wrong': 'number'
        }
    }
}


Test.describe('gggg', {parallel: false}, function (http, assert, delay, fs, child_process, socketio, suite, whoa, cherry, https) {


    setTimeout(function () {
        delay();
    }, 100);


    this.beforeEach(function (t) {

    });

    this.it('makes noise', {}, function () {
        throw new Error('bahahams');
    });


    this.context('moodle', {parallel: false}, function () {

        this.before.cb((t, done) => {
            setTimeout(function () {
                done();
            }, 50);

        });

        this.before.cb((t, done) => {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.before.cb((t, done) => {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.before(function *() {
            var val = yield new Promise(function (resolve) {
                setTimeout(function () {
                    resolve('dude');
                });
            });
        });
    });


    this.describe('moodle', {parallel: true}, function () {


        this.beforeEach.cb((t, done) => {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.beforeEach.cb((t, done) => {
            setTimeout(function () {
                done();
            }, 50);
        }).beforeEach.cb((t, done) => {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.it.cb('mmm1', {parallel: false}, (t, done) => {

            setTimeout(function () {
                done();
            }, 50);

        }).it.cb('mmm2', {parallel: false}, (t) => {

            setTimeout(function () {
                t.done();
            }, 50);

        }).it.cb('mmm3', {parallel: false}, (done, t) => {
            setTimeout(function () {
                done();
            }, 50);

        });

        this.beforeEach.cb(function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.afterEach.cb(function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.afterEach.cb(function (t, done) {
            setTimeout(function () {

                done();
            }, 50);
        });

        this.after(function () {

        });

    });


    this.describe('bum', {parallel: false}, function () {

        this.describe('x', function () {


            this.describe('y', function () {
                this.it('ddd', {
                    parallel: false
                }, function (t, done) {
                    setTimeout(function () {
                        done();
                    }, 50);
                });
            });


            this.it('cccc', {
                parallel: false
            }, function (t, done) {
                setTimeout(function () {
                    done();
                }, 50);
            });
        });


        this.it('aaa1', {
            parallel: false
        }, function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });


        this.it('aaa2', {
            parallel: false
        }, function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });


        this.it('aaa3', {
            parallel: false
        }, function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.it('aaa4', {
            parallel: false
        }, function (t, done) {
            setTimeout(function () {
                done();
            }, 50);

        });

        this.after(function () {

        });

    });


    this.after(function () {

    });

});
