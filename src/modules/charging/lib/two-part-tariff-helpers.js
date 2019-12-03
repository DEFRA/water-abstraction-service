const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});

const TPT_PURPOSES = [380, 390, 400, 410, 420];
const dateFormat = 'YYYY-MM-DD';
const ERROR_NO_RETURNS_FOR_MATCHING = 'no-returns-for-matching';
const ERROR_NO_RETURNS_SUBMITTED = 'no-returns-submitted';
const ERROR_SOME_RETURNS_DUE = 'some-returns-due';
const ERROR_LATE_RETURNS = 'late-returns';
const ERROR_UNDER_QUERY = 'under-query';
const ERROR_RECEIVED = 'received';
const ERROR_OVER_ABSTRACTION = 'over-abstraction';

/**
 * Checks whether error is one which requires a null return
 * @param {String} error
 */
const isNullReturnRequired = error => {
  const nullReturnErrors = [ERROR_NO_RETURNS_SUBMITTED, ERROR_SOME_RETURNS_DUE, ERROR_LATE_RETURNS];
  return nullReturnErrors.includes(error);
};

/**
 * Checks whether a null return is required, otherwise returns error
 * @param {String} error
 * @param {Array} chargeElements
 */
const returnsError = (error, chargeElements) => {
  if (isNullReturnRequired(error)) return getNullActualReturnQuantities(error, chargeElements);
  return { error,
    data: null };
};

/**
 * Sets actualReturnQuantities set to null for all chargeElements
 * @param {Array} chargeElements objects
 * @return {Object}
 *         {null} error
 *         {Array} data chargeElementId & null actualReturnQuantity
 */
const getNullActualReturnQuantities = (error, chargeElements) => {
  const data = chargeElements.map(element => {
    return { error: null, data: { chargeElementId: element.chargeElementId, actualReturnQuantity: null } };
  });
  return { error, data };
};

/**
 * Finds the abstraction period with relevant year for the given start & end dates
 * @param {moment} startDate of return or charge element
 * @param {moment} endDate of return or charge element
 * @param {Object} absDates abstraction dates
 * @param {String} absDates.periodStartDay - abstraction period start day of the month
 * @param {String} absDates.periodStartMonth - abstraction period start month
 * @param {String} absDates.periodEndDay - abstraction period end day of the month
 * @param {String} absDates.periodEndMonth - abstraction period end month
 * @return {moment range} absPeriod - abstraction period with years for given dates
 *
 */
const getAbsPeriod = (startDate, endDate, absDates) => {
  const { periodStartDay, periodStartMonth, periodEndDay, periodEndMonth } = absDates;

  const absStartYear = (new Decimal(periodStartMonth).gte(startDate.month() + 1)) ? startDate.year() : startDate.year() + 1;

  let absStartDate = moment({
    year: absStartYear,
    month: periodStartMonth - 1,
    days: periodStartDay
  });

  let absEndDate = moment({
    year: (new Decimal(periodStartMonth).gte(periodEndMonth)) ? absStartYear + 1 : absStartYear,
    month: periodEndMonth - 1,
    day: periodEndDay
  });
  // if abstraction period straddles the financial year, absPeriod will sometimes be a year ahead
  // this is a sense check for that situation
  if (absStartDate > endDate) {
    absStartDate.subtract(1, 'year');
    absEndDate.subtract(1, 'year');
  }
  return moment.range(absStartDate, absEndDate);
  ;
};

/**
 * Checks whether the return purpose matches the charge element purpose
 * @param {Object} ret return
 * @param {Object} ele charge element
 * @return {Boolean} whether or not the return contains a purpose that matches the charge element purpose
 */
const returnPurposeMatchesElementPurpose = (ret, ele) => {
  const purposeMatch = ret.metadata.purposes.map(purpose => {
    return parseInt(purpose.tertiary.code) === parseInt(ele.purposeTertiary);
  });
  return purposeMatch.includes(true);
};

exports.TPT_PURPOSES = TPT_PURPOSES;
exports.dateFormat = dateFormat;
exports.ERROR_NO_RETURNS_FOR_MATCHING = ERROR_NO_RETURNS_FOR_MATCHING;
exports.ERROR_NO_RETURNS_SUBMITTED = ERROR_NO_RETURNS_SUBMITTED;
exports.ERROR_OVER_ABSTRACTION = ERROR_OVER_ABSTRACTION;
exports.ERROR_SOME_RETURNS_DUE = ERROR_SOME_RETURNS_DUE;
exports.ERROR_LATE_RETURNS = ERROR_LATE_RETURNS;
exports.ERROR_UNDER_QUERY = ERROR_UNDER_QUERY;
exports.ERROR_RECEIVED = ERROR_RECEIVED;
exports.getNullActualReturnQuantities = getNullActualReturnQuantities;
exports.returnsError = returnsError;
exports.getAbsPeriod = getAbsPeriod;
exports.returnPurposeMatchesElementPurpose = returnPurposeMatchesElementPurpose;
