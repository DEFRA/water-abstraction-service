const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});
const { cloneDeep } = require('lodash');
const {
  TPT_PURPOSES,
  getAbsPeriod,
  ERROR_NO_RETURNS_FOR_MATCHING,
  ERROR_NO_RETURNS_SUBMITTED,
  ERROR_SOME_RETURNS_DUE,
  ERROR_LATE_RETURNS,
  ERROR_UNDER_QUERY,
  ERROR_RECEIVED_NO_DATA
} = require('./two-part-tariff-helpers');

const noReturnsSubmitted = (returns, dueReturns) => returns.length === dueReturns.length;

const getReturnsByStatus = (returns, status) => returns.filter(ret => ret.status === status);

/**
 * Checks whether the specific return line is within the return abstraction period
 * @param {Object} ret - return which contains the return line
 * @param {Object} line - return line which is being compared against the return abstraction period
 * @return {Boolean} whether or not some or all of the line is within the abstraction period
 */
const isLineWithinAbstractionPeriod = (ret, line) => {
  const { nald } = ret.metadata;
  const startDate = moment(line.startDate);
  const endDate = moment(line.endDate);
  const absPeriod = getAbsPeriod(startDate, endDate, {
    periodStartDay: nald.periodStartDay,
    periodStartMonth: nald.periodStartMonth,
    periodEndDay: nald.periodEndDay,
    periodEndMonth: nald.periodEndMonth
  });

  return absPeriod.contains(startDate) || absPeriod.contains(endDate);
};

const areAnyReturnsUnderQuery = returns => {
  const isReturnUnderQuery = returns.map(ret => ret.isUnderQuery);
  return isReturnUnderQuery.includes(true);
};

const areReturnsLate = returns => {
  const lateReturns = returns.map(ret => {
    const cutOffDate = moment(returns[0].dueDate).add(3, 'weeks');
    return moment(ret.receivedDate).isAfter(cutOffDate);
  });

  return lateReturns.includes(true);
};

/**
 * Check if all returns are completed
 * @param {Array} returns
 * @return {Array} of error messages if they exist
 */
const checkForReturnsErrors = returns => {
  if (returns.length === 0) return ERROR_NO_RETURNS_FOR_MATCHING;

  const dueReturns = getReturnsByStatus(returns, 'due');
  if (noReturnsSubmitted(returns, dueReturns)) return ERROR_NO_RETURNS_SUBMITTED;
  if (dueReturns.length > 0) return ERROR_SOME_RETURNS_DUE;

  if (areReturnsLate(returns)) return ERROR_LATE_RETURNS;

  if (areAnyReturnsUnderQuery(returns)) return ERROR_UNDER_QUERY;

  if (getReturnsByStatus(returns, 'received').length > 0) return ERROR_RECEIVED_NO_DATA;
};

/**
 * Check through all purposes for TPT purpose
 * @param {Array} purposes from return object
 * @return {Boolean} whether or not the return has a TPT purpose
 */
const isReturnPurposeTPT = purposes => {
  const returnContainsTptPurpose = purposes.map(purpose => {
    return TPT_PURPOSES.includes(parseInt(purpose.tertiary.code));
  });
  return returnContainsTptPurpose.includes(true);
};

/**
 * Filter returns for TPT purposes
 * @param {Array} returns objects
 * @return {Array} returns objects ready for matching with required data points
 */
const getTPTReturns = returns => {
  return returns.filter(ret => isReturnPurposeTPT(ret.metadata.purposes));
};

/**
 * Removes null and nil return lines, converts quantity to ML and adds quantityAllocated
 * @param {Array} returns objects
 * @return {Array} Updated returns array
 */
const prepareReturnLinesData = returns => {
  const updated = cloneDeep(returns);
  updated.forEach(ret => {
    ret.lines = ret.lines.filter(line => {
      return isLineWithinAbstractionPeriod(ret, line) ? line.quantity > 0 : false;
    });

    ret.lines.forEach(retLine => {
      retLine.quantityAllocated = 0;
      const quantity = new Decimal(retLine.quantity);
      retLine.quantity = quantity.dividedBy(1000).toNumber();
    });
  });
  return updated;
};

exports.isLineWithinAbstractionPeriod = isLineWithinAbstractionPeriod;
exports.checkForReturnsErrors = checkForReturnsErrors;
exports.isReturnPurposeTPT = isReturnPurposeTPT;
exports.getTPTReturns = getTPTReturns;
exports.prepareReturnLinesData = prepareReturnLinesData;
