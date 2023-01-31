'use strict'

const moment = require('moment')

const AbstractionPeriod = require('./model')
const Model = require('./model')
const DateRange = require('./date-range')
const ReturnVersion = require('./return-version')
const ReturnRequirement = require('./return-requirement')

const validators = require('./validators')
const config = require('../../../config')

const RETURN_STATUS = {
  completed: 'completed',
  due: 'due',
  received: 'received',
  void: 'void'
}

class Return extends Model {
  constructor (id) {
    super(id)
    this._returnVersions = []
  }

  set id (id) {
    validators.assertReturnId(id)
    this._id = id
  }

  get id () {
    return this._id
  }

  /**
   * Date range of return
   * @param {DateRange} dateRange
   */
  set dateRange (dateRange) {
    validators.assertIsInstanceOf(dateRange, DateRange)
    this._dateRange = dateRange
  }

  get dateRange () {
    return this._dateRange
  }

  /**
   * Purpose uses
   * @todo - deprecate as this should be discovered via the returnRequirement property
   * @param {Array} purposeUses
   */
  set purposeUses (purposeUse) {
    throw new Error('Attempt to set deprecated property Return.purposeUses')
  }

  get purposeUses () {
    const result = this.returnRequirement.returnRequirementPurposes ?? []
    return result
      .map(returnRequirementPurpose => returnRequirementPurpose.purposeUse)
  }

  /**
   * Whether this is a summer return
   * @param {Boolean}
   */
  set isSummer (isSummer) {
    validators.assertIsBoolean(isSummer)
    this._isSummer = isSummer
  }

  get isSummer () {
    return this._isSummer
  }

  /**
   * Whether this return is under query
   * @param {Boolean}
   */
  set isUnderQuery (isUnderQuery) {
    validators.assertIsBoolean(isUnderQuery)
    this._isUnderQuery = isUnderQuery
  }

  get isUnderQuery () {
    return this._isUnderQuery
  }

  /**
   * The due date
   * Stores internally as moment
   * @param {String}
   */
  set dueDate (dueDate) {
    this._dueDate = this.getDateOrThrow(dueDate, 'dueDate')
  }

  /**
   * Get due date as string
   * @return {String} YYYY-MM-DD
   */
  get dueDate () {
    return this._dueDate.format('YYYY-MM-DD')
  }

  /**
   * The received date
   * Stores internally as moment
   * @param {String}
   */
  set receivedDate (receivedDate) {
    this._receivedDate = this.getDateTimeFromValue(receivedDate)
  }

  /**
   * Get due date as string or null
   * @return {String|Null} YYYY-MM-DD
   */
  get receivedDate () {
    return this._receivedDate ? this._receivedDate.format('YYYY-MM-DD') : null
  }

  /**
   * Gets the due date for billing purposes
   * @return {String} YYYY-MM-DD
   */
  get dueDateForBilling () {
    return moment(this._dueDate).add(config.billing.returnsGracePeriod, 'day').format('YYYY-MM-DD')
  }

  /**
   * Was the return received late for billing purposes?
   * The user must send the return date by the due date plus 3 week grace period
   * @return {Boolean}
   */
  get isLateForBilling () {
    return this._receivedDate && this._receivedDate.isAfter(this.dueDateForBilling, 'day')
  }

  /**
   * Checks whether this return is due for billing
   * i.e. the dueDateForBilling is in the past
   * @param {String} [referenceDate] - optional reference date (defaults to now)
   */
  isDueForBilling (referenceDate) {
    return moment(this.dueDateForBilling).isSameOrBefore(moment(referenceDate), 'day')
  }

  /**
   * Sets the return status
   * @param {String} status
   */
  set status (status) {
    validators.assertEnum(status, Object.keys(RETURN_STATUS))
    this._status = status
  }

  /**
   * Gets the return status
   * @return {String}
   */
  get status () {
    return this._status
  }

  /**
   * Sets return versions
   * @return {Array<ReturnVersion>}
   */
  set returnVersions (returnVersions) {
    validators.assertIsArrayOfType(returnVersions, ReturnVersion)
    this._returnVersions = returnVersions
  }

  get returnVersions () {
    return this._returnVersions
  }

  /**
   * Gets current return version
   * @return {ReturnVersion}
   */
  get currentReturnVersion () {
    return this._returnVersions.find(returnVersion => returnVersion.isCurrentVersion)
  }

  /**
   * Abstraction period
   * @return {AbstractionPeriod}
   */
  get abstractionPeriod () {
    return this._abstractionPeriod
  }

  /**
   * A null is permitted here as the abs period start/end day/month properties
   * can be either all set or all null in NALD
   * @param {AbstractionPeriod|null}
   */
  set abstractionPeriod (abstractionPeriod) {
    validators.assertIsNullableInstanceOf(abstractionPeriod, AbstractionPeriod)
    this._abstractionPeriod = abstractionPeriod
  }

  /**
   * The return requirement relating to this return
   * @param {ReturnRequirement}
   */
  set returnRequirement (returnRequirement) {
    validators.assertIsInstanceOf(returnRequirement, ReturnRequirement)
    this._returnRequirement = returnRequirement
  }

  get returnRequirement () {
    return this._returnRequirement
  }
}

module.exports = Return
module.exports.RETURN_STATUS = RETURN_STATUS
