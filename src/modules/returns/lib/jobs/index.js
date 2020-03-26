const { partialRight } = require('lodash');
const onCompleteHandler = require('./on-complete');

const jobs = {
  startUpload: require('./start-upload'),
  mapToJson: require('./map-to-json'),
  validateReturns: require('./validate-returns'),
  persistReturns: require('./persist-returns')
};

exports.startUpload = {
  job: jobs.startUpload,
  onCompleteHandler: partialRight(onCompleteHandler, jobs.mapToJson)
};

exports.mapToJson = {
  job: jobs.mapToJson,
  onCompleteHandler: partialRight(onCompleteHandler, jobs.validateReturns)
};

exports.validateReturns = {
  job: jobs.validateReturns,
  onCompleteHandler
};

exports.persistReturns = {
  job: jobs.persistReturns,
  onCompleteHandler
};
