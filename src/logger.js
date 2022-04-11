const config = require('../config');
const { createLogger } = require('@envage/water-abstraction-helpers').logger;

const logger = createLogger(config.logger);

const newFunc = () => {
  console.log('Empty func test coverage');
};

const newFunc2 = () => {
  console.log('Empty func test coverage');
};

const newFunc3 = () => {
  console.log('Empty func test coverage');
};

const newFunc4 = () => {
  console.log('Empty func test coverage');
};

exports.logger = logger;
exports.newFunc = newFunc;
exports.newFunc2 = newFunc2;
exports.newFunc3 = newFunc3;
exports.newFunc4 = newFunc4;
