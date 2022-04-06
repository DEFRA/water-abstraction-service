'use strict';

const validators = require('./validators');

const Company = require('./company');
const ChargeElement = require('./charge-element');
const DateRange = require('./date-range');
const InvoiceAccount = require('./invoice-account');
const Licence = require('./licence');
const Model = require('./model');
const Region = require('./region');
const ChangeReason = require('./change-reason');
const User = require('./user');
const Note = require('./note');

const { SCHEME, STATUS, SOURCE } = require('./constants');

class ChargeVersion extends Model {
  /**
   * @constructor
   * @param {String} id - the id from water.charge_versions.charge_version_id
   */
  constructor (id) {
    super(id);
    this._chargeElements = [];
    this._scheme = SCHEME.alcs;
  }

  get licence () {
    return this._licence;
  }

  /**
   * Licence
   * @param {Licence} licence
   */
  set licence (licence) {
    validators.assertIsInstanceOf(licence, Licence);
    this._licence = licence;
  }

  get scheme () {
    return this._scheme;
  }

  /**
   * Scheme - ALCS/SROC
   * @param {String} scheme
   */
  set scheme (scheme) {
    validators.assertEnum(scheme, Object.values(SCHEME));
    this._scheme = scheme;
  }

  get versionNumber () {
    return this._versionNumber;
  }

  /**
   * Version number
   * @param {Number} versionNumber
   */
  set versionNumber (versionNumber) {
    validators.assertNullablePositiveInteger(versionNumber);
    this._versionNumber = versionNumber;
  }

  get dateRange () {
    return this._dateRange;
  }

  /**
   * Valid date range
   * @param {String} dateRange
   */
  set dateRange (dateRange) {
    validators.assertIsInstanceOf(dateRange, DateRange);
    this._dateRange = dateRange;
  }

  get status () {
    return this._status;
  }

  /**
   * Status
   * @param {String} status
   */
  set status (status) {
    validators.assertEnum(status, Object.values(STATUS));
    this._status = status;
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

  get source () {
    return this._source;
  }

  /**
   * Source
   * @param {String} source
   */
  set source (source) {
    validators.assertEnum(source, Object.values(SOURCE));
    this._source = source;
  }

  get company () {
    return this._company;
  }

  /**
   * Company (full data in CRM)
   * @param {String} company
   */
  set company (company) {
    validators.assertIsInstanceOf(company, Company);
    this._company = company;
  }

  get invoiceAccount () {
    return this._invoiceAccount;
  }

  /**
   * Invoice account (full data in CRM)
   * @param {String} invoiceAccount
   */
  set invoiceAccount (invoiceAccount) {
    validators.assertIsNullableInstanceOf(invoiceAccount, InvoiceAccount);
    this._invoiceAccount = invoiceAccount;
  }

  get note () {
    return this._note;
  }

  /**
   * Note
   * @param {Note} note
   */
  set note (note) {
    validators.assertIsNullableInstanceOf(note, Note);
    this._note = note;
  }

  get chargeElements () {
    return this._chargeElements;
  }

  /**
   * Charge elements
   * @param {Array<ChargeElement>} chargeElements
   */
  set chargeElements (chargeElements) {
    validators.assertIsArrayOfType(chargeElements, ChargeElement);
    this._chargeElements = chargeElements;
  }

  get changeReason () {
    return this._changeReason;
  }

  /**
   * Change Reason
   * @param {ChangeReason} changeReason
   */
  set changeReason (changeReason) {
    validators.assertIsNullableInstanceOf(changeReason, ChangeReason);
    this._changeReason = changeReason;
  }

  get apportionment () {
    return this._apportionment;
  }

  /*
   * Set the apportionment
   * @param {Boolean} apportionment
   */
  set apportionment (apportionment) {
    validators.assertIsNullableBoolean(apportionment);
    this._apportionment = apportionment;
  }

  get error () {
    return this._error;
  }

  /**
   * Set the error flag
   * @param {Boolean} error
   */
  set error (error) {
    validators.assertIsNullableBoolean(error);
    this._error = error;
  }

  get billedUpToDate () {
    return this._billedUpToDate;
  }

  /**
   * Set the billed up to date
   * @param {String} billedUpToDate
   */
  set billedUpToDate (billedUpToDate) {
    this._billedUpToDate = this.getDateTimeFromValue(billedUpToDate);
  }

  get dateCreated () {
    return this._dateCreated;
  }

  set dateCreated (value) {
    this._dateCreated = this.getDateTimeFromValue(value);
  }

  get dateUpdated () {
    return this._dateUpdated;
  }

  set dateUpdated (value) {
    this._dateUpdated = this.getDateTimeFromValue(value);
  }

  get createdBy () {
    return this._createdBy;
  }

  /**
   * The User who has created the charge version
   * @param {User} createdBy
   */
  set createdBy (createdBy) {
    validators.assertIsNullableInstanceOf(createdBy, User);
    this._createdBy = createdBy;
  }

  get approvedBy () {
    return this._approvedBy;
  }

  /**
   * The User who has approved the charge version
   * @return {User}
   */
  set approvedBy (approvedBy) {
    validators.assertIsNullableInstanceOf(approvedBy, User);
    this._approvedBy = approvedBy;
  }
}

module.exports = ChargeVersion;
module.exports.SCHEME = SCHEME;
module.exports.SOURCE = SOURCE;
module.exports.STATUS = STATUS;
