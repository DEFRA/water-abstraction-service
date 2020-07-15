const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const Decimal = require('decimal.js-light');
const { identity } = require('lodash');
const { TWO_PART_TARIFF_PURPOSE_CODES } = require('../../../../lib/models/purpose');
const {
  ERROR_NO_RETURNS_FOR_MATCHING,
  ERROR_NO_RETURNS_SUBMITTED,
  ERROR_SOME_RETURNS_DUE,
  ERROR_LATE_RETURNS,
  ERROR_UNDER_QUERY,
  ERROR_RECEIVED_NO_DATA
} = require('../../../../lib/models/billing-volume').twoPartTariffStatuses;

const { returns: { date: { isDateWithinAbstractionPeriod } } } = require('@envage/water-abstraction-helpers');

const getReturnsByStatus = (returns, status) => returns.filter(ret => ret.status === status);

/**
 * Checks whether the specific return line is within the return abstraction period
 * @param {Object} ret - return which contains the return line
 * @param {Object} line - return line which is being compared against the return abstraction period
 * @return {Boolean} whether or not some or all of the line is within the abstraction period
 */
const isLineWithinAbstractionPeriod = (ret, line) => {
  const {
    periodStartDay,
    periodStartMonth,
    periodEndDay,
    periodEndMonth
  } = ret.metadata.nald;
  const options = {
    periodStartDay: parseInt(periodStartDay),
    periodStartMonth: parseInt(periodStartMonth),
    periodEndDay: parseInt(periodEndDay),
    periodEndMonth: parseInt(periodEndMonth)
  };

  return isDateWithinAbstractionPeriod(line.startDate, options) || isDateWithinAbstractionPeriod(line.endDate, options);
};

/**
 * Checks if any of the returns are under query
 * @param {Array} returns
 * @return {Boolean} whether or not any of the returns are under query
 */
const areAnyReturnsUnderQuery = returns => {
  const isReturnUnderQuery = returns.map(ret => ret.isUnderQuery);
  return isReturnUnderQuery.includes(true);
};

/**
 * Check if any returns were submitted late (after the grace period)
 * @param {Array} returns
 * @return {Boolean} whether or not there were late returns
 */
const areReturnsLate = returns => {
  const lateReturns = returns.map(ret => {
    const cutOffDate = moment(returns[0].dueDate).add(3, 'weeks');
    return moment(ret.receivedDate).isAfter(cutOffDate);
  });

  return lateReturns.includes(true);
};

const noReturnsSubmitted = (returns, dueReturns) => returns.length === dueReturns.length;

/**
 * Check if any returns are due, throw appropriate error
 * @param {Array} returns
 * @return {String} error message or undefined (by default) if no error
 */
const checkDueReturnsErrors = returns => {
  const dueReturns = getReturnsByStatus(returns, 'due');
  if (dueReturns.length > 0) {
    return noReturnsSubmitted(returns, dueReturns)
      ? ERROR_NO_RETURNS_SUBMITTED
      : ERROR_SOME_RETURNS_DUE;
  }
};

const checkReturnsExistAndHaveLines = returns =>
  returns.length === 0 ? true : returns.some(ret => !ret.lines);

/**
 * Check if all returns are completed
 * @param {Array} returns
 * @return {String} if exists, or undefined
 */
const checkForReturnsErrors = returns => {
  const receivedReturns = getReturnsByStatus(returns, 'received');
  const errors = [
    checkReturnsExistAndHaveLines(returns) ? ERROR_NO_RETURNS_FOR_MATCHING : null,
    checkDueReturnsErrors(returns) || null,
    areReturnsLate(returns) ? ERROR_LATE_RETURNS : null,
    areAnyReturnsUnderQuery(returns) ? ERROR_UNDER_QUERY : null,
    receivedReturns.length > 0 ? ERROR_RECEIVED_NO_DATA : null
  ];

  return errors.filter(identity).shift();
};

/**
 * Check through all purposes for TPT purpose
 * @param {Array} purposes from return object
 * @return {Boolean} whether or not the return has a TPT purpose
 */
const isReturnPurposeTPT = purposes => {
  const returnContainsTptPurpose = purposes.map(purpose => {
    return TWO_PART_TARIFF_PURPOSE_CODES.includes(parseInt(purpose.tertiary.code));
  });
  return returnContainsTptPurpose.includes(true);
};

/**
 * Filter returns for TPT purposes
 * @param {Array} returns objects
 * @return {Array} returns objects ready for matching with required data points
 */
const getTPTReturns = returns =>
  returns.filter(ret => isReturnPurposeTPT(ret.metadata.purposes));

/**
 * Prepares return lines for matching exercise
 * @param {Object} lines containing lines
 */
const prepareLines = ret => ret.lines.filter(line => {
  return isLineWithinAbstractionPeriod(ret, line) ? line.quantity > 0 : false;
}).map(line => {
  return {
    ...line,
    quantityAllocated: 0,
    quantity: new Decimal(line.quantity).dividedBy(1000).toNumber()
  };
});

/**
 * Removes null and nil return lines, converts quantity to ML and adds quantityAllocated
 * @param {Array} returns objects
 * @return {Array} Updated returns array
 */
const prepareReturnLinesData = returns =>
  returns.map(ret => {
    return {
      ...ret,
      lines: ret.lines ? prepareLines(ret) : null
    };
  });

exports.isLineWithinAbstractionPeriod = isLineWithinAbstractionPeriod;
exports.checkForReturnsErrors = checkForReturnsErrors;
exports.isReturnPurposeTPT = isReturnPurposeTPT;
exports.getTPTReturns = getTPTReturns;
exports.prepareReturnLinesData = prepareReturnLinesData;
