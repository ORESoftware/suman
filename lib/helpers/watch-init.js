'use strict';

//core
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const util = require('util');

//npm
const colors = require('colors/safe');

/////////////////////////////////////////////////

module.exports = function (paths, sumanServerInstalled) {

  console.log(' => Suman message => --watch option selected => Suman will watch files in your project, and your tests on changes.');

  if (!sumanServerInstalled) {
    throw new Error(' => Suman server is not installed yet => Please use "$ suman --use-server" ' +
      'in your local project.');
  }
  else {

    if (paths.length > 1) {
      throw new Error(' => Suman usage error => Suman does not currently support using --watch for more than one path.')
    }
    else if (paths.length < 1) {
      throw new Error(' => Suman usage error => Please pass one argument for --watch which should match\n either (1) a' +
        ' given property on your "watch" object property in your suman.conf.js file, or (2) a watchable path on your filesystem.');
    }

    assert(typeof sumanConfig.watch === 'object', 'suman.conf.js needs a "watch" property that is an object.');

    var obj;

    if (String(paths[ 0 ]).indexOf('//') > -1) {
      console.log(' => Looking for property on "watch" named: ', paths[ 0 ]);
      obj = sumanConfig[ 'watch' ][ paths[ 0 ] ];
      if(!obj){
        throw new Error(' => You have passed in a parameter to  the --watch option "' + paths[0] +'",\n' +
          ' but it did not match anything on the "watch" property in your suman.conf.js file,\n' +
          ' available options are:\n\n' + util.inspect(sumanConfig[ 'watch' ]) + '\n\n');
      }

      assert(typeof obj === 'object', 'watch["' + paths[ 0 ] + '"] needs to be an object with include/exclude/script properties.');

      assert(obj.script && obj.include && obj.exclude, 'Please define "script", "include", "exclude" on the "watch" ' +
        'property object in your suman.conf.js file.');


      require('../watching/add-watcher')(obj, null, function (err) {
        if (err) {
          console.error(err.stack || err);
          process.exit(1);
        }
        else {
          console.log('\n\n\t => Suman server running locally now listening for files changes ' +
            'and will run and/or transpile tests for you as they change.');
          console.log('\n\n\t => Suman message => the ' + colors.magenta('--watch') + ' option is set, ' +
            'we are done here for now.');
          console.log('\t To view the options and values that will be used to initiate a Suman test run, ' +
            'use the --verbose or --vverbose options\n\n');
          process.exit(0);
        }
      });
    }
    else {

      var pathToWatch = path.isAbsolute(paths[ 0 ]) ? paths[ 0 ] :
        path.resolve(global.projectRoot + '/' + paths[ 0 ]);

      console.log(' => Looking for file or dir on filesystem with path =', pathToWatch);

      try {
        fs.statSync(pathToWatch);
      }
      catch (e) {
        throw new Error(' => Path given by => "' + pathToWatch + '" does not seem to be a file or directory, if you intended ' +
          'to match a property on the "watch" object in your suman.conf.js file,' +
          ' that property needs to have at least one "//" character sequence');
      }

      require('../watching/add-watcher')(null, pathToWatch, function (err) {
        if (err) {
          console.error(err.stack || err);
          process.exit(1);
        }
        else {
          console.log('\n\n\t => Suman server running locally now listening for files changes ' +
            'and will run and/or transpile tests for you as they change.');
          console.log('\n\n\t => Suman message => the ' + colors.magenta('--watch') + ' option is set, ' +
            'we are done here for now.');
          console.log('\t To view the options and values that will be used to initiate a Suman test run, ' +
            'use the --verbose or --vverbose options\n\n');
          process.exit(0);
        }
      });


    }



  }
};