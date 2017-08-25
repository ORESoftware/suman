//*************************************************************************************************************************************
// this is for dependency injection, y'all
// the purpose is to inject dependencies / values that are acquired *asynchronously*
// synchronous deps should be loaded with the require function, as per usual, but deps and values (such as db values) can and should be loaded via this module
// tests will run in separate processes, but you can use code sharing (not memory sharing) to share setup between tests, which is actually pretty cool
// ****************************************************************************************************************************************
module.exports = function ($core, $deps, $root) {
    var events = $core.events, child_process = $core.child_process, util = $core.util;
    return {
        dependencies: {
            'dog': function () {
                return 'labrador';
            },
            'one': ['four', function (v) {
                    // console.log('one v =>', v);
                    return 'this is one';
                }],
            'two': [function (v) {
                    // console.log('two v =>', v);
                    return 'this is two';
                }],
            'three': ['one', 'two', 'four', function (v) {
                    // console.log('three v =>', v);
                    return 'this is three';
                }],
            'four': ['two', function (v) {
                    // console.log('four v =>', v);
                    return 'this is four';
                }],
            'charlie': function () {
                return 'charlie';
            },
            'smartconnect': function () {
                return Promise.resolve(JSON.stringify({
                    formica: 'not metal'
                }));
            },
            'dolce-vida': function (v, cb) {
                setTimeout(function () {
                    cb(null, "new Error('uuuu rub')");
                }, 10);
            },
            'mulch': function (v, cb) {
                setTimeout(function () {
                    cb(null, "new Error('mulch')");
                }, 10);
            }
        }
    };
};
