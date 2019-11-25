const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});
const { cloneDeep } = require('lodash');
const { TPT_PURPOSES, getAbsPeriod } = require('./two-part-tariff-helpers');

const noReturnsSubmitted = returns => {
  const dueReturns = returns.filter(ret => ret.status === 'due');
  return returns.length === dueReturns.length;
};
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

/**
 * Check if all returns are completed
 * @param {Array} returns
 * @return {Array} of error messages if they exist
 */
const checkReturnsAreCompleted = returns => {
  if (returns.length === 0) {
    return [{
      type: 'return',
      msg: 'No returns available for matching'
    }];
  };
  if (noReturnsSubmitted(returns)) return [{ type: 'returnsNotCompleted' }];
  const errors = returns.reduce((returnErrors, ret) => {
    let msg;
    if (ret.isUnderQuery) msg = `${ret.returnId} is under query`;

    if (!(ret.status === 'completed')) msg = `${ret.returnId} is not completed`;

    if (msg) returnErrors.push({ type: 'return', msg });

    return returnErrors;
  }, []);
  return (errors.length > 0) ? errors : null;
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
exports.checkReturnsAreCompleted = checkReturnsAreCompleted;
exports.isReturnPurposeTPT = isReturnPurposeTPT;
exports.getTPTReturns = getTPTReturns;
exports.prepareReturnLinesData = prepareReturnLinesData;
