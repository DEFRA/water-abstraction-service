'use strict';

const { isFinite } = require('lodash');

const Model = require('./model');
const ReturnLine = require('./return-line');
const DateRange = require('./date-range');

const validators = require('./validators');
const { TIME_PERIODS } = require('./constants');

const dateRangeIsInAbstractionPeriod = (abstractionPeriod, dateRange) => {
  const isStartDateInAbstractionPeriod = abstractionPeriod.isDateWithinAbstractionPeriod(dateRange.startDate);
  const isEndDateInAbstractionPeriod = abstractionPeriod.isDateWithinAbstractionPeriod(dateRange.endDate);
  return isStartDateInAbstractionPeriod || isEndDateInAbstractionPeriod;
};

const proRataReturnLineForBilling = (returnLine, chargePeriod) => {
  // No need to pro-rata daily lines as they are either in or out of charge period
  if (returnLine.timePeriod === TIME_PERIODS.day) {
    return returnLine;
  }

  // Calculate ratio of intersecting days between return line and charge period
  const daysInLine = 1 + returnLine.dateRange.days;
  const rangeA = returnLine.dateRange.toMomentRange();
  const rangeB = chargePeriod.toMomentRange();

  const intersectingDays = 1 + DateRange.fromMomentRange(rangeB.intersect(rangeA)).days;
  const ratio = intersectingDays / daysInLine;

  const newLine = new ReturnLine();
  newLine.pickFrom(returnLine, ['id', 'dateRange', 'timePeriod']);
  return newLine.fromHash({
    volume: returnLine.volume * ratio
  });
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
   * Returns only return lines that
   * - overlap the charge period
   * - are in the return abstraction period
   * - have a non-zero/null value
   * Lines with a date range partially intersecting the charge period have
   * their volume pro-rated
   * @param {DateRange} chargePeriod
   * @param {DateRange} abstractionPeriod
   */
  getReturnLinesForBilling (chargePeriod, abstractionPeriod) {
    return this._returnLines
      .filter(returnLine => isFinite(returnLine.volume) && returnLine.volume > 0)
      .filter(returnLine => dateRangeIsInAbstractionPeriod(abstractionPeriod, returnLine.dateRange))
      .filter(returnLine => returnLine.dateRange.overlaps(chargePeriod))
      .map(returnLine => proRataReturnLineForBilling(returnLine, chargePeriod));
  }
}

module.exports = ReturnVersion;
