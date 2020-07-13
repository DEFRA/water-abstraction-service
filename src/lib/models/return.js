'use strict';

const moment = require('moment');

const AbstractionPeriod = require('./model');
const Model = require('./model');
const DateRange = require('./date-range');
const PurposeUse = require('./purpose-use');
const ReturnVersion = require('./return-version');

const validators = require('./validators');

const RETURN_STATUS = {
  completed: 'completed',
  due: 'due',
  received: 'received',
  void: 'void'
};

class Return extends Model {
  set id (id) {
    validators.assertReturnId(id);
    this._id = id;
  }

  /**
   * Date range of return
   * @param {DateRange} dateRange
   */
  set dateRange (dateRange) {
    validators.assertIsInstanceOf(dateRange, DateRange);
    this._dateRange = dateRange;
  }

  get dateRange () {
    return this._dateRange;
  }

  /**
   * Purpose uses
   * @param {Array} purposeUses
   */
  set purposeUses (purposeUses) {
    validators.assertIsArrayOfType(purposeUses, PurposeUse);
    this._purposesUses = purposeUses;
  }

  get purposeUses () {
    return this._purposesUses;
  }

  /**
   * Whether this is a summer return
   * @param {Boolean}
   */
  set isSummer (isSummer) {
    validators.assertIsBoolean(isSummer);
    this._isSummer = isSummer;
  }

  get isSummer () {
    return this._isSummer;
  }

  /**
   * Whether this return is under query
   * @param {Boolean}
   */
  set isUnderQuery (isUnderQuery) {
    validators.assertIsBoolean(isUnderQuery);
    this._isUnderQuery = isUnderQuery;
  }

  get isUnderQuery () {
    return this._isUnderQuery;
  }

  /**
   * The due date
   * Stores internally as moment
   * @param {String}
   */
  set dueDate (dueDate) {
    this._dueDate = this.getDateOrThrow(dueDate, 'dueDate');
  }

  /**
   * Get due date as string
   * @return {String} YYYY-MM-DD
   */
  get dueDate () {
    return this._dueDate.format('YYYY-MM-DD');
  }

  /**
   * The received date
   * Stores internally as moment
   * @param {String}
   */
  set receivedDate (receivedDate) {
    this._receivedDate = this.getDateTimeFromValue(receivedDate);
  }

  /**
   * Get due date as string or null
   * @return {String|Null} YYYY-MM-DD
   */
  get receivedDate () {
    return this._receivedDate ? this._receivedDate.format('YYYY-MM-DD') : null;
  }

  /**
   * Was the return received late for billing purposes?
   * The user must send the return date by the due date plus 3 week grace period
   * @return {Boolean}
   */
  get isLateForBilling () {
    const comparisonDate = moment(this._dueDate).add(3, 'weeks');
    return this.receivedDate && this.receivedDate.isAfter(comparisonDate, 'day');
  }

  /**
   * Sets the return status
   * @param {String} status
   */
  set status (status) {
    validators.assertEnum(status, Object.keys(RETURN_STATUS));
    this._status = status;
  }

  /**
   * Gets the return status
   * @return {String}
   */
  get status () {
    return this._status;
  }

  /**
   * Sets return versions
   * @return {Array<ReturnVersion>}
   */
  set returnVersions (returnVersions) {
    validators.assertIsArrayOfType(returnVersions, ReturnVersion);
    this._returnVersions = returnVersions;
  }

  get returnVersions () {
    return this._returnVersions;
  }

  /**
   * Gets current return version
   * @return {ReturnVersion}
   */
  get currentReturnVersion () {
    const versions = this.returnVersions || [];
    return versions.find(returnVersion => returnVersion.isCurrent);
  }

  /**
   * Abstraction period
   * @return {AbstractionPeriod}
   */
  get abstractionPeriod () {
    return this._abstractionPeriod;
  }

  set abstractionPeriod (abstractionPeriod) {
    validators.assertIsInstanceOf(abstractionPeriod, AbstractionPeriod);
    this._abstractionPeriod = abstractionPeriod;
  }
}

module.exports = Return;
module.exports.RETURN_STATUS = RETURN_STATUS;
