'use strict';

const validators = require('./validators');

const Company = require('./company');
const ChargeElement = require('./charge-element');
const DateRange = require('./date-range');
const InvoiceAccount = require('./invoice-account');
const Licence = require('./licence');
const Model = require('./model');
const Region = require('./region');

const SCHEME = {
  alcs: 'alcs',
  sroc: 'sroc'
};

const STATUS = {
  draft: 'draft',
  current: 'current',
  superseded: 'superseded'
};

const SOURCE = {
  nald: 'nald',
  wrls: 'wrls'
};

class ChargeVersion extends Model {
  /**
   * Licence
   * @param {Licence}
   */
  set licence (licence) {
    validators.assertIsInstanceOf(licence, Licence);
    this._licence = licence;
  }

  get licence () {
    return this._licence;
  }

  /**
   * Scheme - ALCS/SROC
   * @param {String}
   */
  set scheme (scheme) {
    validators.assertEnum(scheme, Object.values(SCHEME));
    this._scheme = scheme;
  }

  get scheme () {
    return this._scheme;
  }

  /**
   * Version number
   * @param {Number}
   */
  set versionNumber (versionNumber) {
    validators.assertPositiveInteger(versionNumber);
    this._versionNumber = versionNumber;
  }

  get versionNumber () {
    return this._versionNumber;
  }

  /**
   * Valid date range
   * @param {String}
   */
  set dateRange (dateRange) {
    validators.assertIsInstanceOf(dateRange, DateRange);
    this._dateRange = dateRange;
  }

  get dateRange () {
    return this._dateRange;
  }

  /**
   * Status
   * @param {String}
   */
  set status (status) {
    validators.assertEnum(status, Object.values(STATUS));
    this._status = status;
  }

  get status () {
    return this._status;
  }

  /**
   * Gets the region - 1 of 8 regions related to NALD_SYSTEM_PARAMS
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
   * Source
   * @param {String}
   */
  set source (source) {
    validators.assertEnum(source, Object.values(SOURCE));
    this._source = source;
  }

  get source () {
    return this._source;
  }

  /**
   * Company (full data in CRM)
   * @param {String}
   */
  set company (company) {
    validators.assertIsInstanceOf(company, Company);
    this._company = company;
  }

  get company () {
    return this._company;
  }

  /**
   * Invoice account (full data in CRM)
   * @param {String}
   */
  set invoiceAccount (invoiceAccount) {
    validators.assertIsInstanceOf(invoiceAccount, InvoiceAccount);
    this._invoiceAccount = invoiceAccount;
  }

  get invoiceAccount () {
    return this._invoiceAccount;
  }

  /**
   * Charge elements
   * @param {Array<ChargeElement>}
   */
  set chargeElements (chargeElements) {
    validators.assertIsArrayOfType(chargeElements, ChargeElement);
    this._chargeElements = chargeElements;
  }

  get chargeElements () {
    return this._chargeElements;
  }
}

module.exports = ChargeVersion;
module.exports.SCHEME = SCHEME;
module.exports.STATUS = STATUS;
module.exports.SOURCE = SOURCE;
