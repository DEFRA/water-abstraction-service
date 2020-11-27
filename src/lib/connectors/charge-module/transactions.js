'use strict';

const request = require('./request');

/**
 * Gets transaction summary data
 * @param {String} transactionId - CM bill ID GUID
 * @return {Promise<Object>} response payload
 */
const get = transactionId =>
  request.get(`v1/wrls/transactions/${transactionId}`);

exports.get = get;
