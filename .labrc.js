// default settings for lab test runs.
//
// This is overridden if arguments are passed to lab via the command line.
module.exports = {
  // This version global seems to be introduced by sinon.
  globals: 'version,payload,fetch,Response,Headers,Request,__coverage__,__extends,__assign,__rest,__decorate,__param,__metadata,__awaiter,__generator,__exportStar,__createBinding,__values,__read,__spread,__spreadArrays,__await,__asyncGenerator,__asyncDelegator,__asyncValues,__makeTemplateObject,__importStar,__importDefault,__classPrivateFieldGet,__classPrivateFieldSet,__core-js_shared__,CSS,regeneratorRuntime,core',

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
