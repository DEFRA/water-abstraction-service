const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});

const TPT_PURPOSES = [380, 390, 400, 410, 420];
const dateFormat = 'YYYY-MM-DD';

const returnMatchingError = error => {
  return { error,
    data: null };
};

/**
 *
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
    return parseInt(purpose.tertiary.code) === ele.purposeTertiary;
  });
  return purposeMatch.includes(true);
};

exports.TPT_PURPOSES = TPT_PURPOSES;
exports.dateFormat = dateFormat;
exports.returnMatchingError = returnMatchingError;
exports.getAbsPeriod = getAbsPeriod;
exports.returnPurposeMatchesElementPurpose = returnPurposeMatchesElementPurpose;
