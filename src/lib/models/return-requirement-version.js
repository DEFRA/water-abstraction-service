'use strict'

const Model = require('./model')
const DateRange = require('./date-range')
const ReturnRequirement = require('./return-requirement')
const { RETURN_SEASONS } = require('./constants')

const validators = require('./validators')

const RETURN_REQUIREMENT_VERSION_STATUSES = {
  current: 'current',
  draft: 'draft',
  superseded: 'superseded'
}

/**
 * A model to provide a version history for a collection of return requirements
 * on a licence
 * @class
 */
class ReturnRequirementVersion extends Model {
  /**
   * @constructor
   * @param {String} id
   */
  constructor (id) {
    super(id)
    this._returnRequirements = []
  }

  /**
   * Sets the date range of the return line
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
   * Sets the status
   * @param {String} status
   */
  set status (status) {
    validators.assertEnum(status, Object.keys(RETURN_REQUIREMENT_VERSION_STATUSES))
    this._status = status
  }

  /**
   * Gets the status
   * @return {String}
   */
  get status () {
    return this._status
  }

  /**
   * Checks if this return version is not draft - i.e. either current or superseded
   * @return {Boolean}
   */
  get isNotDraft () {
    return this.status !== RETURN_REQUIREMENT_VERSION_STATUSES.draft
  }

  set returnRequirements (returnRequirements) {
    validators.assertIsArrayOfType(returnRequirements, ReturnRequirement)
    this._returnRequirements = returnRequirements
  }

  get returnRequirements () {
    return this._returnRequirements
  }

  /**
   * Checks whether this return version has any formats with a two-part tariff purpose
   * in the supplied season
   * Note: this doesn't necessarily mean the licence has two-part tariff agreement
   * @param {String} returnSeason
   * @return {Boolean}
   */
  hasTwoPartTariffPurposeReturnsInSeason (returnSeason) {
    validators.assertEnum(returnSeason, Object.values(RETURN_SEASONS))
    const isSummer = returnSeason === RETURN_SEASONS.summer

    return this.returnRequirements
      .filter(returnRequirement => returnRequirement.isSummer === isSummer)
      .some(returnRequirement => returnRequirement.isTwoPartTariffPurposeUse)
  }
}

module.exports = ReturnRequirementVersion
module.exports.RETURN_REQUIREMENT_VERSION_STATUSES = RETURN_REQUIREMENT_VERSION_STATUSES
