'use strict';

const suman = require('suman');
const Test = suman.init(module);


Test.create(function (it, before, beforeEach, describe, context, after) {


  // beforeEach.cb(h => {
  //   return Promise.delay(2000);
  // });

  it('should pass');

  before('merry', [{fatal:false}, t => {
    throw new Error('marf is not a marf');
  }]);

  beforeEach.cb('alpha', h => {
    setTimeout(h, 1);
  });

  it.cb('is normal xxx', ({done, ctn}) => {
    ctn();
  });

  // after('ooooooo', function () {
  //   console.log('original thought.');
  // });

  it.cb('is NOT skipped', t => {
    t.done();
  });

  it.cb('is NOT skipped', t => {
    t.done();
  });

  it.cb('is NOT skipped', t => {
    t.done();
  });

  it.cb('is NOT skipped', t => {
    t.done();
  });

  it.cb.skip('is NOT 222 skipped', t => {
    t.done();
  });

  it.cb('is NOT skipped', t => {
    t.done();
  });

  // after('xxxx', function (t) {
  //   console.log(`original thought ${t.desc}.`);
  // });

  it.cb('is stubbed 1');

  describe.skip('foo', function(){

  });

  describe('pajamas', function () {

    this.describe.skip('rudolph',function(){
       this.it('is cool', t => {

       });
    });

    it.cb.skip('is NOT 222 skipped', t => {
      t.done();
    });


    beforeEach.cb('beta1', h => {
      setTimeout(h, 10);
    });

    beforeEach.cb('beta2', h => {
      setTimeout(h, 10);
    });

    it('is stubbed 2', t => {
      return 3
    });

  });

  // describe('running', function () {
  //
  //   it('zoooom1');
  //
  //   describe('running A', function () {
  //
  //     it('zoooom2A');
  //     it('zoooom2A');
  //     it('zoooom2A');
  //     it('zoooom2A');
  //     it('zoooom2A');
  //     it('zoooom2A');
  //
  //     after('eeeeeeee', function (t) {
  //       console.log(`original thought - ${t.desc}.`);
  //     });
  //
  //   });
  //
  //   describe('running B', function () {
  //
  //     it('zoooom2B');
  //
  //     describe('running B', function () {
  //
  //       it('zoooom2B');
  //
  //       after('uuuuuuuuu', function (t) {
  //         console.log(`original thought - ${t.desc}.`);
  //       });
  //
  //     });
  //
  //     after('yyyyyyy', function (t) {
  //       console.log(`original thought - ${t.desc}.`);
  //     });
  //
  //   });
  //
  //   describe('running C', function () {
  //
  //     it('zoooom2C');
  //     it('zoooom3C');
  //
  //   });
  // });

  // before.cb('done', t => {
  //
  //   t.done();
  //   t.done();
  //
  // });

});
