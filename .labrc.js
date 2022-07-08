'use strict'
// default settings for lab test runs.
//
// This is overridden if arguments are passed to lab via the command line.
module.exports = {
  verbose: true,
  coverage: true,
  // Means when we use *.only() in our tests we just get the output for what we've flagged rather than all output but
  // greyed out to show it was skipped
  'silent-skips': true,
  // lcov reporter required for SonarCloud
  reporter: ['console', 'html', 'lcov'],
  output: ['stdout', 'coverage/coverage.html', 'coverage/lcov.info'],
  // This version global seems to be introduced by sinon.
  globals: [
    'version','payload','fetch','Response','Headers','Request','__coverage__','__extends','__assign','__rest',
    '__decorate','__param','__metadata','__awaiter','__generator','__exportStar','__createBinding','__values','__read',
    '__spread','__spreadArrays','__await','__asyncGenerator','__asyncDelegator','__asyncValues','__makeTemplateObject',
    '__importStar','__importDefault','__classPrivateFieldGet','__classPrivateFieldSet','__core-js_shared__','CSS',
    'regeneratorRuntime','core','__spreadArray','global-symbol-property'
  ].join(',')
};
