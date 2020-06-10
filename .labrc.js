// default settings for lab test runs.
//
// This is overridden if arguments are passed to lab via the command line.
module.exports = {
  // This version global seems to be introduced by sinon.
  globals: 'version,payload,fetch,Response,Headers,Request,__coverage__',

  'coverage-exclude': [
    'data',
    'migrations',
    'node_modules',
    'scripts',
    'src/lib/connectors/bookshelf',
    'test',
    'integration-tests'
  ]
};
