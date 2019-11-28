const moment = require('moment');
const { identity, first, last, sortBy, omit, isEqual } = require('lodash');

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

/**
 * Checks whether 2 objects have adjacent date ranges.
 * Object a must have an endDate that is either null, or 1 day before
 * the startDate property of object b
 * @param {Object} a
 * @param {Object} b
 * @return {Boolean}
 */
const isAdjacentDateRange = (a, b) => {
  const expectedEndDate = moment(b.startDate).subtract(1, 'day').format(DATE_FORMAT);
  return [null, expectedEndDate].includes(b.endDate);
};

/**
 * Default implementation of equality test between two objects
 * for history merging.
 * Checks if the objects are equal when taking into account all
 * properties except startDate and endDate
 * @param {Object} a
 * @param {Object} b
 * @return {Boolean}
 */
const equalityTest = (a, b) => {
  const objA = omit(a, ['startDate', 'endDate']);
  const objB = omit(b, ['startDate', 'endDate']);
  return isEqual(objA, objB);
};

/**
 * @TODO replace with water-abstraction-helpers function once merged
 * Given an array of objects sorted by date, de-duplicates them where adjacent array items
 * are identical except for their date ranges, extending the endDate property of
 * earlier element to that of the later element
 * @param {Array} arr - a list of objects, each with startDate and endDate properties
 * @param {Function} func - a function which tests if adjacent objects can be merged
 * @return {Array} an array with histories merged
 */
const mergeHistory = (arr, isEqual = equalityTest) => arr.reduce((acc, row) => {
  const previousRow = last(acc);
  if (isEqual(row, previousRow) && isAdjacentDateRange(row, previousRow)) {
    last(acc).endDate = row.endDate;
  } else {
    acc.push(row);
  }
  return acc;
}, []);

exports.getFinancialYearRange = getFinancialYearRange;
exports.getSmallestDateRange = getSmallestDateRange;
exports.isAdjacentDateRange = isAdjacentDateRange;
exports.mergeHistory = mergeHistory;
