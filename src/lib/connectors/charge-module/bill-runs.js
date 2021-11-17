'use strict';

const got = require('./lib/got-cm');

/**
 * Creates a bill run in the CM for the specified region code
 * @param {String} region - the single letter region code
 * @param ruleset
 * @return {Promise<Object>} response payload
 */
const create = (region) =>
  got.post('v2/wrls/bill-runs', { json: { region } });

/**
 * Adds a transaction to the specified bill run
 * @param {String} billRunId - CM bill ID GUID
 * @param {Object} transaction - CM transaction payload
 * @return {Promise<Object>} response payload
 */
const addTransaction = (billRunId, transaction) =>
  got.post(`v2/wrls/bill-runs/${billRunId}/transactions`, { json: transaction, retries: 0 });

/**
 * Approves the spefified CM bill run
 * @param {String} billRunId - CM bill ID GUID
 * @return {Promise<Object>} response payload
 */
const approve = billRunId =>
  got.patch(`v2/wrls/bill-runs/${billRunId}/approve`);

/**
 * Sends the specified CM bill run
 * @param {String} billRunId - CM bill ID GUID
 * @return {Promise<Object>} response payload
 */
const send = billRunId =>
  got.patch(`v2/wrls/bill-runs/${billRunId}/send`);

/**
 * Deletes a specified invoice from a given bill run
 * @param {String} billRunId - CM bill ID GUID
 * @param {String} invoiceId - CM invoice ID GUID
 * @return {Promise<Object>} response payload
 */
const deleteInvoiceFromBillRun = (billRunId, invoiceId) =>
  got.delete(`v2/wrls/bill-runs/${billRunId}/invoices/${invoiceId}`);

/**
 * Deletes entire bill run
 * @param {String} billRunId - CM bill ID GUID
 * @return {Promise<Object>} response payload
 */
const deleteBillRun = billRunId =>
  got.delete(`v2/wrls/bill-runs/${billRunId}`);

/**
 * Gets bill run including summary data
 * @param {String} billRunId - CM bill ID GUID
 * @return {Promise<Object>} response payload
 */
const get = billRunId =>
  got.get(`v2/wrls/bill-runs/${billRunId}`);

/**
   * Gets transactions in given bill run for a particular invoice.
   * @param {String} billRunId
   * @param {String} invoiceId
   */
const getInvoiceTransactions = (billRunId, invoiceId) =>
  got.get(`v2/wrls/bill-runs/${billRunId}/invoices/${invoiceId}`);

const generate = CMBillRunId =>
  got.patch(`v2/wrls/bill-runs/${CMBillRunId}/generate`);

const rebillInvoice = async (billRunId, invoiceId) =>
  got.patch(`v2/wrls/bill-runs/${billRunId}/invoices/${invoiceId}/rebill`);

const getStatus = async billRunId =>
  got.get(`v2/wrls/bill-runs/${billRunId}/status`);

const deleteLicence = async (billRunId, licenceId) =>
  got.delete(`v2/wrls/bill-runs/${billRunId}/licences/${licenceId}`);

exports.addTransaction = addTransaction;
exports.approve = approve;
exports.create = create;
exports.delete = deleteBillRun;
exports.get = get;
exports.deleteBillRun = deleteBillRun;
exports.send = send;
exports.getInvoiceTransactions = getInvoiceTransactions;
exports.deleteInvoiceFromBillRun = deleteInvoiceFromBillRun;
exports.generate = generate;
exports.rebillInvoice = rebillInvoice;
exports.deleteLicence = deleteLicence;
exports.getStatus = getStatus;
