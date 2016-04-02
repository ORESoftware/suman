#!/usr/bin/env node --harmony


/*

 if (require.main !== module || process.argv.indexOf('--suman') > -1) {
 //prevents users from f*king up by accident and getting in some possible infinite process.spawn loop that will lock up their system
 console.log('Warning: attempted to require Suman index.js but this cannot be.');
 return;
 }

 */

//TODO: need to make sure to make suman_results readable/writable
//TODO: need to figure out way to grep suite name without having to run the test
//TODO: add option to do no reporting but at command line for speed
//TODO: need to handle stubbed tests
//TODO: need to implement  -b, --bail   => bail after first test failure
//TODO: suman command line input should allow for a file and directory combination
//TODO: suman --init should install suamn node_module, and suman directory at root of project, and suman.conf.js at root of project
//TODO: readme needs to have examples by ES5, ES6, ES7
//TODO: default configuration should provide default values using lodash defaults / underscore defaults
//TODO: switch from underscore to lodash
//TODO: get it to work with Istanbul/NYC  <<
//TODO: if no tests are run, need to indicate this
//TODO: special key combo (ctrl+save+r) will run tests after a change, using gulp file watchers?
//TODO: https://nodejs.org/en/blog/uncategorized/profiling-node-js/
//TODO: npm i babel -g, then babel-node --stage 0 myapp.js
//TODO: if no grep-suite
//TODO: https://github.com/nodejs/node/issues/5252
//TODO: http://www.node-tap.org/basics/
//TODO: need a suman server stop command at the command line
//TODO, along with options {timeout:true}, {parallel:true}, {delay:100} we should have {throws:true}, so that we expect a test to throw an (async) error...
//TODO, add option for {timeout: 3000}
//TODO: if error is thrown after test is completed (in a setTimeout, for example) do we handle that?
//TODO: if suman/suman runner runs files and they are not suman suites, then suman needs to report that!!
//TODO: if suman/suman runner runs legit suman tests but the tests have no test cases, it needs to report that too
//TODO: suman -s (server) needs to try user's config first, if that fails, then use default suman config
//TODO: randomize test runs as per https://github.com/sindresorhus/ava/issues/595
//TODO: steal unicode chars from existing projects
//TODO: logging to disk or to network may be out of order so may need to do sync logging at end of run, instead of async during
//TODO: does babel-node work with child_prcesses?
//TODO: allow possibility to inject before/after/describe/context/it/test/beforeEach/afterEach into describes/contexts
//TODO: create suman --diagnostics option at command line to check for common problems
//TODO: write metadata file out along with txt files
//TODO: interface (TDD/BDD) should be an option in suman.init options obj



/////////////////////////////////////////////////////////////////

/**
 * Represents a book.
 * @constructor
 */
const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');
const os = require('os');
const domain = require('domain');
const cp = require('child_process');


////////////////////////////////////////////////////////////////////

/** This is a description of the foo function. */
const pkgJSON = require('./package.json');
const v = pkgJSON.version;
console.log(colors.gray.italic(' => Suman v' + v + ' running...'));

////////////////////////////////////////////////////////////////////

/**
 * Class representing a socket connection.
 *
 * @class
 * @tutorial socket-tutorial
 */
const cwd = process.cwd();

////////////////////////////////////////////////////////////////////

//#project
var sumanUtils = require('./lib/utils');
var suman = require('./lib');

const root = sumanUtils.findProjectRoot(process.cwd());

////////////////////////////////////////////////////////////////////

/**
 * Solves equations of the form a * x = b
 * @example <caption>Example usage of method1.</caption>
 * // returns 2
 * treasure maker
 * globalNS.method1(5, 10);
 * @returns {Number} Returns the value of x for the equation.
 */
var sumanInstalledLocally = true;

var err;

try {
    require.resolve(root + '/node_modules/suman');
} catch (e) {
    err = e;
}
finally {
    if (err) {
        sumanInstalledLocally = false;
        console.log(' ' + colors.yellow('=> Suman message => note that Suman is not installed locally, you may wish to run "$ suman --init"'));
    }
    else {
        console.log(' ' + colors.yellow('=> Suman message => Suman appears to be installed locally.'));

    }
}


////////////////////////////////////////////////////////////////////

const args = JSON.parse(JSON.stringify(process.argv.slice(2))); //copy args

////////////////////////////////////////////////////////////////////


var sumanConfig, configPath, index, init, serverName, pth, convert, src, dest;


if (args.indexOf('--cfg') !== -1) {
    index = args.indexOf('--cfg');
    configPath = args[index + 1];
    args.splice(index, 2);
}

if (args.indexOf('--n') !== -1) {
    index = args.indexOf('--n');
    serverName = args[index + 1];
    args.splice(index, 2);
}

if (args.indexOf('--init') !== -1) {
    init = true;
}

if (args.indexOf('--convert') !== -1) {
    index = args.indexOf('--convert');
    src = args[index + 1];
    dest = args[index + 2];
    args.splice(index, 3);
    if (args.indexOf('-f') === -1) {
        console.log('Are you sure you want to remove all contents within the folder with path="' + path.resolve(root + '/' + dest) + '" ?');
        console.log('If you are sure, try the same command with the -f option.');
        console.log('Oh, and by the way, before deleting dirs in general, its a good idea to run a commit with whatever source control system you are using.');
        return;
    }
    else {
        convert = true;
    }
}

try {
    pth = path.resolve(configPath || (cwd + '/' + 'suman.conf.js'));
    sumanConfig = require(pth);
    if (sumanConfig.verbose !== false) {  //default to true
        console.log(colors.cyan(' => Suman config used: ' + pth + '\n'));
    }
    //TODO: There's a potential bug where the user passes a test path to the config argument like so --cfg path/to/test
}
catch (err) {
    //TODO: try to get suman.conf.js from root of project

    console.log(colors.bgBlack.yellow(' => Suman warning => Could not find path to your config file in your current working directory or given by --cfg at the command line...'));
    console.log(colors.bgBlack.yellow(' => ...are you sure you issued the suman command in the right directory? ...now looking for a config file at the root of your project...'));

    try {
        pth = path.resolve(sumanUtils.findProjectRoot(cwd) + '/' + 'suman.conf.js');
        sumanConfig = require(pth);
        if (sumanConfig.verbose !== false) {  //default to true
            console.log(colors.cyan(' => Suman config used: ' + pth + '\n'));
        }
    }
    catch (err) {
        console.log(colors.bgCyan.black(' => Suman msg => Warning - no configuration found in your project, using default Suman configuration.'));
        try {
            pth = path.resolve(__dirname + '/suman.default.conf.js');
            sumanConfig = require(pth);
        }
        catch (err) {
            console.error('\n => ' + err + '\n');
            return;
        }
    }
}

if (init) {

    require('./lib/init/init-project')({
        force: process.argv.indexOf('--force') || process.argv.indexOf('-f')
    });

} else if (convert) {

    require('./lib/convert-files/convert-dir')(src, dest);

} else if (args.indexOf('--server') !== -1 || args.indexOf('-s') !== -1) {

    suman.Server({
        //configPath: 'suman.conf.js',
        config: sumanConfig,
        serverName: serverName || os.hostname()
    }).on('msg', function (msg) {
        switch (msg) {
            case 'listening':
                console.log('Suman server is listening on localhost:6969');
                // process.exit();
                break;
            default:
                console.log(msg);
        }
    }).on('SUMAN_SERVER_MSG', function (msg) {
        switch (msg) {
            case 'listening':
                console.log('Suman server is listening on localhost:6969');
                // process.exit();
                break;
            default:
                console.log(msg);
        }
    });

}
else {

    var dir, grepFile, grepSuite, useRunner, d;

    d = domain.create();

    d.once('error', function (err) {
        //TODO: add link showing how to set up Babel
        console.log(colors.magenta(' => Suman warning => (note: You will need to transpile your test files manually if you wish to use ES7 features, or use $ suman-babel instead of $ suman.)' + '\n' +
            ' => Suman error => ' + err.stack + '\n'));
    });


    if (args.indexOf('--grep-file') !== -1) {
        index = args.indexOf('--grep-file');
        grepFile = args[index + 1];
        args.splice(index, 2);
    }

    if (args.indexOf('--grep-suite') !== -1) {
        index = args.indexOf('--grep-suite');
        grepSuite = args[index + 1];
        args.splice(index, 2);
    }

    if (args.indexOf('--rnr') !== -1) {
        index = args.indexOf('--rnr');
        useRunner = true;
        args.splice(index, 1);
    }

    //whatever args are remaining are assumed to be file or directory paths to tests
    dir = (JSON.parse(JSON.stringify(args)) || []).filter(function (item) {
        if (String(item).indexOf('-') === 0) {
            console.log(colors.magenta(' => Suman warning => Probably a bad command line option "' + item + '", Suman is ignoring it.'))
            return false;
        }
        return true;
    });

    if (dir.length < 1) {
        console.error('   ' + colors.bgCyan('Suman error => No test file or dir specified at command line') + '\n\n');
        return;
    }
    else {

        //TODO: if only one file is used with the runner, then there is no possible blocking, so we can ignore the suman.order.js file,
        // and pretend it does not exist.

        dir = dir.map(function (item) {
            return path.resolve(item);
        });

        if (!useRunner && dir.length === 1 && fs.statSync(dir[0]).isFile()) {
            //TODO: we could read file in (fs.createReadStream) and see if suman is referenced
            d.run(function () {
                process.sumanConfig = sumanConfig;
                require(dir[0]);  //if only 1 item and the one item is a file, we don't use the runner, we just run that file straight up
            });
        }
        else {
            d.run(function () {
                suman.Runner({
                    grepSuite: grepSuite,
                    grepFile: grepFile,
                    $node_env: process.env.NODE_ENV,
                    fileOrDir: dir,
                    config: sumanConfig
                    //configPath: configPath || 'suman.conf.js'
                }).on('message', function (msg) {
                    console.log('msg from suman runner', msg);
                    //process.exit(msg);
                });
            });
        }
    }
}
