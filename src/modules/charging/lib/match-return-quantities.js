const { cloneDeep } = require('lodash');
const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});

const { dateFormat } = require('./two-part-tariff-helpers');

/**
 * Create moment range for return line or charge element
 */
const getDateRange = obj => moment.range([
  moment(obj.effectiveStartDate || obj.startDate, dateFormat),
  moment(obj.effectiveEndDate || obj.endDate, dateFormat)
]);

/**
 * Checks whether the return line overlaps the effective date range of the charge element
 */
const doesLineOverlapChargeElementDateRange = (line, ele) => {
  const lineRange = getDateRange(line);
  const eleRange = getDateRange(ele);
  return eleRange.overlaps(lineRange);
};

/**
 * Checks whether there is space in the allowable quantity in the charge element
 */
const isChargeElementFull = chargeElement => chargeElement.actualReturnQuantity === chargeElement.authorisedAnnualQuantity;

/**
 * Checks whether or not all of the return quantity has already been allocated
 */
const isQuantityAllocated = returnLine => returnLine.quantity === returnLine.quantityAllocated;

/**
 * Return the number of days in a date range
 */
const getNumberOfDaysInRange = range => range.end.diff(range.start, 'days') + 1;

/**
 * Calculate the pro rata quantity for a given return line when matching to a
 * specific charge element
 * @param {Object} line return line
 * @param {Object} ele charge element
 * @return {Decimal} pro rata quantity in Decimal format for use in further calculations
 */
const getProRataQuantity = (line, ele) => {
  const lineRange = getDateRange(line);
  const eleRange = getDateRange(ele);
  const intersectionOfRanges = eleRange.intersect(lineRange);
  const abstractionDaysInChargeElement = getNumberOfDaysInRange(intersectionOfRanges);
  const totalAbstractionDays = getNumberOfDaysInRange(lineRange);

  const proRataFactor = new Decimal(abstractionDaysInChargeElement / totalAbstractionDays);
  return proRataFactor.times(line.quantity);
};

/**
 * Checks and matches a return line against a charge element
 * @param {Object} line return line
 * @param {Object} ele charge element
 * @return {Object} updated element quantity & updated allocated quantity for return line
 */
const matchReturnLineToElement = (line, ele) => {
  const updatedEle = cloneDeep(ele);
  const updatedLine = cloneDeep(line);
  if (doesLineOverlapChargeElementDateRange(line, ele)) {
    if (!isChargeElementFull(ele) && !isQuantityAllocated(line)) {
      const proRataQuantity = getProRataQuantity(line, ele);

      const unallocatedQuantity = proRataQuantity.minus(line.quantityAllocated);
      const remainingAllowableQuantity = new Decimal(ele.authorisedAnnualQuantity).minus(ele.actualReturnQuantity);

      const quantityToBeAllocated = Math.min(unallocatedQuantity, remainingAllowableQuantity);
      updatedEle.actualReturnQuantity = new Decimal(ele.actualReturnQuantity).plus(quantityToBeAllocated).toNumber();
      updatedLine.quantityAllocated = new Decimal(line.quantityAllocated).plus(quantityToBeAllocated).toNumber();
    }
  }
  return {
    updatedElementQuantity: updatedEle.actualReturnQuantity,
    updatedLineQuantityAllocated: updatedLine.quantityAllocated
  };
};

exports.getProRataQuantity = getProRataQuantity;
exports.doesLineOverlapChargeElementDateRange = doesLineOverlapChargeElementDateRange;
exports.matchReturnLineToElement = matchReturnLineToElement;
