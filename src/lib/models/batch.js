'use strict';

const Joi = require('@hapi/joi');
const Invoice = require('./invoice');
const FinancialYear = require('./financial-year');
const Region = require('./region');
const Totals = require('./totals');
const { assert } = require('@hapi/hoek');
const { isArray } = require('lodash');

const { assertIsInstanceOf, assertEnum, assertIsArrayOfType, assertPositiveInteger } = require('./validators');

/**
 * Statuses that the batch (water.billing_batches) may have. These
 * are here to help enforce that only one batch per region may
 * be run at a time.
 */
const BATCH_STATUS = {
  processing: 'processing', // processing trasactions
  review: 'review', // two-part tariff only - reviewing results of returns matching
  ready: 'ready', // processing completed - awaiting approval
  sent: 'sent', // approved & sent to Charge Module
  error: 'error'
};

const VALID_SEASON = Joi.string().valid('summer', 'winter', 'all year').required();

const Model = require('./model');

const BATCH_TYPE = {
  annual: 'annual',
  supplementary: 'supplementary',
  twoPartTariff: 'two_part_tariff'
};

class Batch extends Model {
  constructor (id) {
    super(id);
    this._invoices = [];
  }

  /**
   * Sets the batch type for this batch
   * @param {String} batchType
   */
  set type (batchType) {
    assertEnum(batchType, Object.values(BATCH_TYPE));
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
   * Checks whether this is a supplementary batch
   * @return {Boolean}
   */
  isSupplementary () {
    return this._type === BATCH_TYPE.supplementary;
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
    assertEnum(status, Object.keys(BATCH_STATUS));
    this._status = status;
  }

  /**
   * Gets the batch status
   * @return {String}
   */
  get status () {
    return this._status;
  }

  set dateCreated (value) {
    this._dateCreated = this.getDateTimeFromValue(value);
  }

  get dateCreated () {
    return this._dateCreated;
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

  set invoices (invoices) {
    assertIsArrayOfType(invoices, Invoice);
    this._invoices = invoices;
  }

  /**
   * Sets the region for the batch.
   * A batch can only be related to a single region at present
   * @return {Region}
   */
  get region () {
    return this._region;
  }

  set region (region) {
    assertIsInstanceOf(region, Region);
    this._region = region;
  }

  isTwoPartTariff () {
    return this.type === BATCH_TYPE.twoPartTariff;
  }

  /**
   * The charge module summary contains data on
   * invoice/credit count, invoice/credit totals, net total
   * @param {Totals} totals
   */
  set totals (totals) {
    assertIsInstanceOf(totals, Totals);
    this._totals = totals;
  }

  get totals () {
    return this._totals;
  }

  /**
   * Sets the external ID.  This is the bill run ID in the charge module.
   * @return {Region}
   */
  get externalId () {
    return this._externalId;
  }

  set externalId (externalId) {
    assertPositiveInteger(externalId);
    this._externalId = externalId;
  }
}

module.exports = Batch;
module.exports.BATCH_TYPE = BATCH_TYPE;
module.exports.BATCH_STATUS = BATCH_STATUS;
