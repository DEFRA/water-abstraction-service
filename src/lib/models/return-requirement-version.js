'use strict';

const Model = require('./model');
const DateRange = require('./date-range');
const ReturnRequirement = require('./return-requirement');

const validators = require('./validators');

const RETURN_REQUIREMENT_VERSION_STATUSES = {
  current: 'current',
  draft: 'draft',
  superseded: 'superseded'
};

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
    super(id);
    this._returnRequirements = [];
  }

  /**
   * Sets the date range of the return line
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
   * Sets the status
   * @param {String} status
   */
  set status (status) {
    validators.assertEnum(status, Object.keys(RETURN_REQUIREMENT_VERSION_STATUSES));
    this._status = status;
  }

  /**
   * Gets the status
   * @return {String}
   */
  get status () {
    return this._status;
  }

  set returnRequirements (returnRequirements) {
    validators.assertIsArrayOfType(returnRequirements, ReturnRequirement);
    this._returnRequirements = returnRequirements;
  }

  get returnRequirements () {
    return this._returnRequirements;
  }
}

module.exports = ReturnRequirementVersion;
module.exports.RETURN_REQUIREMENT_VERSION_STATUSES = RETURN_REQUIREMENT_VERSION_STATUSES;
