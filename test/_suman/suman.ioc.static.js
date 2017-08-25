'use strict';
////////////
//load async deps for any of your suman tests
module.exports = function ($core, $deps) {
    return {
        dependencies: {
            'chuck': function () {
                return 'berry';
            },
            'mark': function (cb) {
                cb(null, 'rutherfurd');
            }
        }
    };
};
