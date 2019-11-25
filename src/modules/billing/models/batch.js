const Joi = require('@hapi/joi');
const Invoice = require('./invoice');
const FinancialYear = require('./financial-year');
const Region = require('./region');

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
   * Sets the region for this batch
   * @param {Region} region
   */
  set region (region) {
    if (!(region instanceof Region)) {
      throw new Error('Instance of Region expected');
    }
    this._region = region;
  }

  /**
   * Gets the region for this batch
   * @return {Region}
   */
  get regionId () {
    return this._regionId;
  }

  /**
   * Sets the batch type for this batch
   * @param {String} batchType
   */
  set batchType (batchType) {
    Joi.assert(batchType, VALID_BATCH_TYPE);
    this._batchType = batchType;
  }

  /**
   * Gets the batch type for this batch
   * @return {String}
   */
  get batchType () {
    return this._batchType;
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
    if (!(startYear instanceof FinancialYear)) {
      throw new Error('Instance of FinancialYear expected');
    }
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
    if (!(endYear instanceof FinancialYear)) {
      throw new Error('Instance of FinancialYear expected');
    }
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
   * Adds an invoice to the batch
   * @return {String}
   */
  addInvoice (invoice) {
    // Validate type
    if (!(invoice instanceof Invoice)) {
      throw new Error('Instance of Invoice expected');
    }
    // Each customer ref can only appear once in batch
    if (this.getInvoiceByAccountNumber(invoice.accountNumber)) {
      throw new Error(`An invoice with account number ${invoice.invoiceAccountNumber} is already in the batch`);
    }
    this._invoices.push(invoice);
    return this;
  }

  getInvoiceByAccountNumber (accountNumber) {
    return this._invoices.find(
      row => row.invoiceAccountNumber === invoice.invoiceAccountNumber
    );
  }

  /**
   * Gets invoices in the batch
   * @return {Array}
   */
  get invoices () {
    return this._invoices;
  }
}

module.exports = Batch;
