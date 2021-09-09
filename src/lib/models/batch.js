'use strict';

const Invoice = require('./invoice');
const FinancialYear = require('./financial-year');
const Region = require('./region');
const Totals = require('./totals');
const { assert } = require('@hapi/hoek');
const { isArray } = require('lodash');

const validators = require('./validators');

/**
 * Statuses that the batch (water.billing_batches) may have. These
 * are here to help enforce that only one batch per region may
 * be run at a time.
 */
const BATCH_STATUS = {
  processing: 'processing', // processing transactions
  review: 'review', // two-part tariff only - reviewing results of returns matching
  ready: 'ready', // processing completed - awaiting approval
  sent: 'sent', // approved & sent to Charge Module
  error: 'error',
  // if there are no charge versions, or all billing has already happened
  // in earlier run, or all customers have been removed from the batch
  empty: 'empty'
};

const BATCH_ERROR_CODE = {
  failedToPopulateChargeVersions: 10,
  failedToProcessChargeVersions: 20,
  failedToPrepareTransactions: 30,
  failedToCreateCharge: 40,
  failedToCreateBillRun: 50,
  failedToDeleteInvoice: 60,
  failedToProcessTwoPartTariff: 70,
  failedToGetChargeModuleBillRunSummary: 80,
  failedToProcessRebilling: 90
};

const BATCH_TYPE = {
  annual: 'annual',
  supplementary: 'supplementary',
  twoPartTariff: 'two_part_tariff'
};

const BATCH_SOURCE = {
  nald: 'nald',
  wrls: 'wrls'
};

class Batch extends Totals {
  constructor (id) {
    super(id);
    this._invoices = [];
  }

  /**
   * Sets the batch type for this batch
   * @param {String} batchType
   */
  set type (batchType) {
    validators.assertEnum(batchType, Object.values(BATCH_TYPE));
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
   * Checks whether this is a two-part tariff batch
   * @return {Boolean}
   */
  isTwoPartTariff () {
    return this.type === BATCH_TYPE.twoPartTariff;
  }

  /**
   * Checks whether this is an annual batch
   * @return {Boolean}
   */
  isAnnual () {
    return this.type === BATCH_TYPE.annual;
  }

  /**
   * Sets if this batch is for a summer season two part tariff run
   * @param {Boolean} isSummer
   */
  set isSummer (isSummer) {
    validators.assertIsBoolean(isSummer);
    this._isSummer = isSummer;
  }

  /**
   * Is this batch a summer season two part tariff run
   * @return {Boolean}
   */
  get isSummer () {
    return this._isSummer;
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
    validators.assertEnum(status, Object.keys(BATCH_STATUS));
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

  set dateUpdated (value) {
    this._dateUpdated = this.getDateTimeFromValue(value);
  }

  get dateUpdated () {
    return this._dateUpdated;
  }

  /**
   * Adds a single invoice to the batch
   * @return {Invoice}
   */
  addInvoice (invoice) {
    // Validate type
    assert(invoice instanceof Invoice, 'Instance of Invoice expected');
    // Each customer ref can only appear once in batch
    if (this.getInvoiceByAccountNumberAndFinancialYear(invoice.invoiceAccount.accountNumber, invoice.financialYear)) {
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
   * Gets an invoice in the batch by invoice account number and financial year
   * @param {String} accountNumber
   * @param {FinancialYear} financialYear
   * @return {Invoice|undefined}
   */
  getInvoiceByAccountNumberAndFinancialYear (accountNumber, financialYear) {
    validators.assertString(accountNumber);
    validators.assertIsInstanceOf(financialYear, FinancialYear);
    return this._invoices.find(invoice => {
      const isAccountNumberMatch = invoice.invoiceAccount.accountNumber === accountNumber;
      const isFinancialYearMatch = invoice.financialYear.isEqualTo(financialYear);
      return isAccountNumberMatch && isFinancialYearMatch;
    });
  }

  /**
   * Gets all invoices in the batch
   * @return {Array}
   */
  get invoices () {
    return this._invoices;
  }

  set invoices (invoices) {
    validators.assertIsArrayOfType(invoices, Invoice);
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
    validators.assertIsInstanceOf(region, Region);
    this._region = region;
  }

  /**
   * Sets the external ID.  This is the bill run ID in the charge module.
   * @return {Region}
   */
  get externalId () {
    return this._externalId;
  }

  set externalId (externalId) {
    validators.assertId(externalId);
    this._externalId = externalId;
  }

  get errorCode () { return this._errorCode; }

  set errorCode (errorCode) {
    validators.assertNullableEnum(errorCode, Object.values(BATCH_ERROR_CODE));
    this._errorCode = errorCode;
  }

  /**
   * Checks if the status of the batch matches any of the passed status values
   *
   * @param  {...String} statuses A list of statuses to match with the batch status
   */
  statusIsOneOf (...statuses) {
    return statuses.includes(this.status);
  }

  /**
   * Does this batch have a status that means the batch can be deleted?
   */
  canBeDeleted () {
    return this.statusIsOneOf(
      BATCH_STATUS.empty,
      BATCH_STATUS.error,
      BATCH_STATUS.ready,
      BATCH_STATUS.review
    );
  }

  /**
   * Does this batch have a status that means the batch invoices
   * associated with the batch can be deleted?
   */
  canDeleteInvoices () {
    return this.statusIsOneOf(BATCH_STATUS.ready);
  }

  /**
   * Does this batch have a status that means it can have a
   * two-part tariff approval?
   */
  canApproveReview () {
    return this.statusIsOneOf(BATCH_STATUS.review);
  }

  /**
   * The bill run number is an integer ID for the bill run sent to SSCL
   * Only unique within a region
   * @param {Number} integer
   */
  set billRunNumber (billRunNumber) {
    validators.assertPositiveInteger(billRunNumber);
    this._billRunNumber = billRunNumber;
  }

  /**
   * @return {Number} integer
   */
  get billRunNumber () {
    return this._billRunNumber;
  }

  /**
   * The batch source indicates whether the batch originated in WRLS
   * or was imported from NALD data
   *
   * @param {String} source
   */
  set source (source) {
    validators.assertEnum(source, Object.values(BATCH_SOURCE));
    this._source = source;
  }

  get source () {
    return this._source;
  }
}

module.exports = Batch;
module.exports.BATCH_TYPE = BATCH_TYPE;
module.exports.BATCH_STATUS = BATCH_STATUS;
module.exports.BATCH_ERROR_CODE = BATCH_ERROR_CODE;
module.exports.BATCH_SOURCE = BATCH_SOURCE;
