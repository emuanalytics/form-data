#!/usr/bin/env node
var path = require('path');
var spawn = require('child_process').spawn;
var static = require('./static');
var far = require('far').create();
var basePath = process.cwd();
var istanbul = path.join(basePath, './node_modules/.bin/istanbul');

// augment Far to support istanbul
if (process.env.running_under_istanbul) {
  far.constructor.prototype._execute = function(file) {
    this._printStatus(file);

    var node = spawn(istanbul, [
      'cover',
      '--report', 'none',
      '--print', 'none',
      '--include-all-sources',
      '--include-pid',
      '--root', basePath,
      file
    ]);

    var output = '';

    node.stdout.setEncoding('utf8');
    node.stderr.setEncoding('utf8');

    /**
     * Collects output delivered in chunks
     * @param {string} chunk - partial output
     */
    function onOutput(chunk) {
      if (this._verbose > 1) {
        process.stderr.write(chunk);
      } else {
        output += chunk;
      }
    }

    node.stdout.on('data', onOutput.bind(this));
    node.stderr.on('data', onOutput.bind(this));

    node.on('exit', function(code) {
      this._index++;
      this._printTestResult(file, code, output);
      this._executeNext();
    }.bind(this));
  };
}
// continue as normal

if (process.env.verbose) {
  far.verbose(process.env.verbose);
}

far.add(__dirname);
far.include(/test-.*\.js$/);

// start static server for all tests
static(function() {
  far.execute();
});
