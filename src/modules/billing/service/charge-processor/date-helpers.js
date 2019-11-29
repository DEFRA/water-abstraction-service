const moment = require('moment');
const { identity, first, last, sortBy } = require('lodash');

const DATE_FORMAT = 'YYYY-MM-DD';

const getFinancialYearRange = financialYear => ({
  startDate: `${financialYear - 1}-04-01`,
  endDate: `${financialYear}-03-31`
});

/**
 * Given an array of dates which can be parsed by Moment,
 * filters out falsey values and returns a list of moment objects
 * sorted in ascending date order
 * @param {Array<String>} arr
 * @return {Array<Object>}
 */
const getSortedDates = arr => sortBy(
  arr
    .filter(identity)
    .map(value => moment(value)),
  m => m.unix()
);

const getMinDate = arr => first(getSortedDates(arr));
const getMaxDate = arr => last(getSortedDates(arr));

/**
 * Given an array of objects, each with a startDate and endDate property,
 * an object is returned containing the maximum possible start date, and
 * the minimum possible end date
 * @param {Array} arr
 * @return {Object}
 */
const getSmallestDateRange = arr => {
  const startDates = arr.map(obj => obj.startDate);
  const endDates = arr.map(obj => obj.endDate);
  return {
    startDate: getMaxDate(startDates).format(DATE_FORMAT),
    endDate: getMinDate(endDates).format(DATE_FORMAT)
  };
};

exports.getFinancialYearRange = getFinancialYearRange;
exports.getSmallestDateRange = getSmallestDateRange;
