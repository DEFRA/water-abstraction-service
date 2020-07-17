'use strict';

const Model = require('./model');
const ReturnLine = require('./return-line');
const AbstractionPeriod = require('./abstraction-period');

const validators = require('./validators');

const dateRangeIsInAbstractionPeriod = (abstractionPeriod, dateRange) => {
  const isStartDateInAbstractionPeriod = abstractionPeriod.isDateWithinAbstractionPeriod(dateRange.startDate);
  const isEndDateInAbstractionPeriod = abstractionPeriod.isDateWithinAbstractionPeriod(dateRange.endDate);
  return isStartDateInAbstractionPeriod || isEndDateInAbstractionPeriod;
};

class ReturnVersion extends Model {
  constructor (id) {
    super(id);
    this._returnLines = [];
  }

  /**
   * Sets return versions
   * @return {Array<ReturnVersion>}
   */
  set returnLines (returnLines) {
    validators.assertIsArrayOfType(returnLines, ReturnLine);
    this._returnLines = returnLines;
  }

  get returnLines () {
    return this._returnLines;
  }

  /**
   * Whether this return is a nil return
   * @param {Boolean}
   */
  set isNilReturn (isNilReturn) {
    validators.assertIsBoolean(isNilReturn);
    this._isNilReturn = isNilReturn;
  }

  get isNilReturn () {
    return this._isNilReturn;
  }

  /**
   * Whether this return is the current version
   * @param {Boolean}
   */
  set isCurrentVersion (isCurrentVersion) {
    validators.assertIsBoolean(isCurrentVersion);
    this._isCurrentVersion = isCurrentVersion;
  }

  get isCurrentVersion () {
    return this._isCurrentVersion;
  }

  /**
   * Gets an array of lines which fall in the supplied abs period.
   * If either the start date or the end date is in the abs period,
   * this is considered a match
   * @param {abstractionPeriod} abstractionPeriod
   * @return {Array}
   */
  getLinesInAbstractionPeriod (abstractionPeriod) {
    validators.assertIsInstanceOf(abstractionPeriod, AbstractionPeriod);
    return this._returnLines.filter(returnLine => dateRangeIsInAbstractionPeriod(abstractionPeriod, returnLine.dateRange));
  }
}

module.exports = ReturnVersion;
