'use strict';

const { partial } = require('lodash');
const promiseRetry = require('promise-retry');
const { logger } = require('../../../logger');
const config = require('../../../../config');

const customersApi = require('./customers');

/**
 * Wraps a charge module API method so that it retries a number
 * of times, awaiting a status other than 'generating_summary'
 * @param {String} method - charge module bill run connector method
 * @param  {...any} args - additional arguments
 */
const retry = (method, ...args) => {
  const func = async (retry, number) => {
    try {
      logger.log('info', `Calling ${method} ${args.join(', ')} attempt ${number}`);
      const response = await customersApi[method](...args);
      return response;
    } catch (err) {
      logger.log('error', `Something went wrong when calling ${method} ${args.join(', ')} attempt ${number}`);
      retry();
    }
  };

  return promiseRetry(func, config.chargeModuleConnector);
};

exports.updateCustomer = partial(retry, 'updateCustomer');
