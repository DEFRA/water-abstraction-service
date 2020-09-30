'use strict';

const { get, partial } = require('lodash');
const promiseRetry = require('promise-retry');
const { logger } = require('../../../logger');

const billRunsApi = require('./bill-runs');

const isCMGeneratingSummary = cmResponse => get(cmResponse, 'billRun.status') === 'generating_summary';

const options = {
  retries: 10,
  factor: 2,
  minTimeout: 5 * 1000
};

/**
 * Gets data from the CM API, throwing an error if summary generation still in progress
 * @param {String} method - charge module bill run connector method
 * @param  {...any} args - additional arguments
 */
const getOrThrowIfGeneratingSummary = async (method, ...args) => {
  // Call base API method
  const data = await billRunsApi[method](...args);
  if (isCMGeneratingSummary(data)) {
    throw new Error(`Charge module still generating summary for ${method} ${args.join(', ')}`);
  }
  return data;
};

/**
 *
 * @param {String} method - charge module bill run connector method
 * @param  {...any} args - additional arguments
 */
const retry = (method, ...args) => {
  const func = (retry, number) => {
    logger.log('info', `Calling ${method} ${args.join(', ')} attempt ${number}`);
    return getOrThrowIfGeneratingSummary(method, ...args)
      .catch(retry);
  };

  return promiseRetry(func, options);
};

exports.get = partial(retry, 'get');
exports.getCustomer = partial(retry, 'getCustomer');
exports.options = options;
