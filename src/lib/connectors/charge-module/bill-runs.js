'use strict';

const request = require('./request');

/**
 * Creates a bill run in the CM for the specified region code
 * @param {String} region - the single letter region code
 * @return {Promise<Object>} response payload
 */
const create = region =>
  request.post('v1/wrls/billruns', { region });

/**
 * Adds a transaction to the specified bill run
 * @param {String} billRunId - CM bill ID GUID
 * @param {Object} transaction - CM transaction payload
 * @return {Promise<Object>} response payload
 */
const addTransaction = (billRunId, transaction) =>
  request.post(`v1/wrls/billruns/${billRunId}/transactions`, transaction);

/**
 * Approves the spefified CM bill run
 * @param {String} billRunId - CM bill ID GUID
 * @return {Promise<Object>} response payload
 */
const approve = billRunId =>
  request.patch(`v1/wrls/billruns/${billRunId}/approve`);

/**
 * Sends the spefified CM bill run
 * @param {String} billRunId - CM bill ID GUID
 * @return {Promise<Object>} response payload
 */
const send = billRunId =>
  request.post(`v1/wrls/billruns/${billRunId}/send`);

/**
 * Removes an individual customer from the bill run
 * @param {String} billRunId - CM bill ID GUID
 * @param {String} customerReference - invoice account number
 * @param {Number} financialYearEnding
 * @return {Promise<Object>} response payload
 */
const removeCustomerInFinancialYear = (billRunId, customerReference, financialYearEnding) =>
  request.delete(`v1/wrls/billruns/${billRunId}/transactions`, { customerReference, financialYear: financialYearEnding - 1 });

/**
 * Deletes entire bill run
 * @param {String} billRunId - CM bill ID GUID
 * @return {Promise<Object>} response payload
 */
const deleteBillRun = billRunId =>
  request.delete(`v1/wrls/billruns/${billRunId}`);

/**
 * Gets bill run including summary data
 * @param {String} billRunId - CM bill ID GUID
 * @return {Promise<Object>} response payload
 */
const get = billRunId =>
  request.get(`v1/wrls/billruns/${billRunId}`);

const getCustomer = (billRunId, customerReference) =>
  request.get(`v1/wrls/billruns/${billRunId}`, { customerReference });

const getTransactions = (billRunId, page = 1, perPage = 100) =>
  request.get(`v1/wrls/billruns/${billRunId}/transactions`, { page, perPage });

const getCustomerTransactions = (billRunId, customerReference, page = 1, perPage = 100) =>
  request.get(`v1/wrls/billruns/${billRunId}/transactions`, { customerReference, page, perPage });
/**
   * Gets transactions in given bill run for supplied customer ref / financial year grouping
   * @param {String} billRunId
   * @param {String} customerReference
   * @param {Number} financialYearEnding
   * @param {Number} [page] - default 1
   */
const getInvoiceTransactions = (billRunId, customerReference, financialYearEnding, page = 1) => {
  const path = `v1/wrls/billruns/${billRunId}/transactions`;
  const query = {
    customerReference,
    financialYear: financialYearEnding - 1,
    page,
    perPage: 100
  };
  return request.get(path, query);
};

exports.addTransaction = addTransaction;
exports.approve = approve;
exports.create = create;
exports.delete = deleteBillRun;
exports.get = get;
exports.getCustomer = getCustomer;
exports.getTransactions = getTransactions;
exports.getCustomerTransactions = getCustomerTransactions;
exports.removeCustomerInFinancialYear = removeCustomerInFinancialYear;
exports.send = send;
exports.getInvoiceTransactions = getInvoiceTransactions;
