const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});
const { cloneDeep } = require('lodash');
const { TPT_PURPOSES, getAbsPeriod } = require('./two-part-tariff-helpers');

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
 * AWAITING FURTHER INFORMATION FROM RACHEL
 * @param {Array} returns
 */
const checkReturnsAreCompleted = returns => {
  const returnErrors = returns.map(ret => {
    const { returnId } = ret;
    if (ret.isUnderQuery) {
      return { type: 'return',
        msg: `${returnId} is under query` };
    }
    if (!ret.status === 'completed') {
      return { type: 'return',
        msg: `${returnId} is not completed` };
    }
  });
  return returnErrors;
};

/**
 * Check through all purposes for TPT purpose
 * @param {Array} purposes from return object
 * @return {Boolean} whether or not the return has a TPT purpose
 */
const checkReturnPurposes = purposes => {
  return purposes.map(purpose => {
    return TPT_PURPOSES.includes(parseInt(purpose.tertiary.code));
  });
};

/**
 * Filter returns for TPT purposes
 * @param {Array} returns objects
 * @return {Array} returns objects ready for matching with required data points
 */
const getTPTReturns = returns => {
  return returns.filter(ret => {
    const returnContainsTptPurpose = checkReturnPurposes(ret.metadata.purposes);
    return returnContainsTptPurpose.includes(true);
  });
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
exports.getTPTReturns = getTPTReturns;
exports.prepareReturnLinesData = prepareReturnLinesData;
