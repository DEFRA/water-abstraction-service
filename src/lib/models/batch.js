const Joi = require('@hapi/joi');
const Invoice = require('./invoice');
const FinancialYear = require('./financial-year');
const { assert } = require('@hapi/hoek');
const { isArray } = require('lodash');

const VALID_GUID = Joi.string().guid().required();
const VALID_BATCH_TYPE = Joi.string().valid('annual', 'supplementary', 'two_part_tariff').required();
const VALID_SEASON = Joi.string().valid('summer', 'winter', 'all year').required();
const VALID_STATUS = Joi.string().valid('processing', 'complete', 'error').required();

class Batch {
  constructor () {
    this._invoices = [];
  }

  /**
   * Sets the GUID ID for this batch
   * @param {String} id
   */
  set id (id) {
    Joi.assert(id, VALID_GUID);
    this._id = id;
  }

  /**
   * Gets the GUID ID for this batch
   * @return {String}
   */
  get id () {
    return this._id;
  }

  /**
   * Sets the batch type for this batch
   * @param {String} batchType
   */
  set type (batchType) {
    Joi.assert(batchType, VALID_BATCH_TYPE);
    this._type = batchType;
  }

  /**
   * Gets the batch type for this batch
   * @return {String}
   */
  get type () {
    return this._type;
  }

  /**
   * Sets the season for this batch
   * @param {String} season
   */
  set season (season) {
    Joi.assert(season, VALID_SEASON);
    this._season = season;
  }

  /**
   * Gets the season for this batch
   * @return {String}
   */
  get season () {
    return this._season;
  }

  /**
   * Sets the start financial year for this batch
   * @param {FinancialYear} startYear
   */
  set startYear (startYear) {
    assert(startYear instanceof FinancialYear, 'FinancialYear expected');
    this._startYear = startYear;
  }

  /**
 * Gets the start financial year for this batch
 * @return {FinancialYear}
 */
  get startYear () {
    return this._startYear;
  }

  /**
 * Sets the end financial year for this batch
 * @param {FinancialYear} startYear
 */
  set endYear (endYear) {
    assert(endYear instanceof FinancialYear, 'FinancialYear expected');
    this._endYear = endYear;
  }

  /**
 * Gets the end financial year for this batch
 * @return {FinancialYear}
 */
  get endYear () {
    return this._endYear;
  }

  /**
   * Sets the batch status
   * @param {String} status
   */
  set status (status) {
    Joi.assert(status, VALID_STATUS);
    this._status = status;
  }

  /**
   * Gets the batch status
   * @return {String}
   */
  get status () {
    return this._status;
  }

  /**
   * Adds a single invoice to the batch
   * @return {Invoice}
   */
  addInvoice (invoice) {
    // Validate type
    assert(invoice instanceof Invoice, 'Instance of Invoice expected');
    // Each customer ref can only appear once in batch
    if (this.getInvoiceByAccountNumber(invoice.invoiceAccount.accountNumber)) {
      throw new Error(`An invoice with account number ${invoice.invoiceAccountNumber} is already in the batch`);
    }
    this._invoices.push(invoice);
    return this;
  }

  /**
   * Add an array of invoices to the batch
   * @param {Array<Invoice>} invoices
   */
  addInvoices (invoices = []) {
    assert(isArray(invoices), 'Array expected');
    return invoices.map(invoice => this.addInvoice(invoice));
  }

  /**
   * Gets an invoice in the batch by invoice account number
   * @param {String} accountNumber
   */
  getInvoiceByAccountNumber (accountNumber) {
    return this._invoices.find(
      invoice => invoice.invoiceAccount.accountNumber === accountNumber
    );
  }

  /**
   * Gets all invoices in the batch
   * @return {Array}
   */
  get invoices () {
    return this._invoices;
  }
}

module.exports = Batch;
