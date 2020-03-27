const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const Decimal = require('decimal.js-light');
const { returns: { date: { isDateWithinAbstractionPeriod } } } = require('@envage/water-abstraction-helpers');

const { dateFormat } = require('./two-part-tariff-helpers');

/**
 * Create moment range for return line or charge element
 */
const getDateRange = obj => moment.range([
  moment(obj.startDate, dateFormat),
  moment(obj.endDate, dateFormat)
]);

/**
 * Checks whether the return line overlaps the effective date range of the charge element
 */
const doesLineOverlapChargeElementDateRange = (line, ele) => {
  const options = {
    periodStartDay: ele.abstractionPeriodStartDay,
    periodStartMonth: ele.abstractionPeriodStartMonth,
    periodEndDay: ele.abstractionPeriodEndDay,
    periodEndMonth: ele.abstractionPeriodEndMonth
  };
  const lineOverlapsChargeElement = getDateRange(ele).overlaps(getDateRange(line));
  const lineIsInAbstractionPeriod = isDateWithinAbstractionPeriod(line.startDate, options) || isDateWithinAbstractionPeriod(line.endDate, options);

  return lineOverlapsChargeElement && lineIsInAbstractionPeriod;
};

/**
 * Checks whether or not all of the return quantity has already been allocated
 */
const isQuantityAllocated = returnLine => returnLine.quantity <= returnLine.quantityAllocated;

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
const getProRataQuantityToAllocate = (line, ele) => {
  const lineRange = getDateRange(line);
  const eleRange = getDateRange(ele);

  const intersectionOfRanges = eleRange.intersect(lineRange);
  const abstractionDaysInChargeElement = getNumberOfDaysInRange(intersectionOfRanges);
  const totalAbstractionDays = getNumberOfDaysInRange(lineRange);
  const proRataFactor = new Decimal(abstractionDaysInChargeElement).dividedBy(totalAbstractionDays);

  return proRataFactor.times(line.quantity);
};

/**
 * Checks and matches a return line against a charge element
 * @param {Object} line return line
 * @param {Object} ele charge element
 * @return {Object} updated element quantity & updated allocated quantity for return line
 */
const matchReturnLineToElement = (line, ele) => {
  const data = {
    updatedMaxPossibleReturnQuantity: ele.maxPossibleReturnQuantity,
    updatedElementQuantity: ele.actualReturnQuantity,
    updatedLineQuantityAllocated: line.quantityAllocated
  };

  if (doesLineOverlapChargeElementDateRange(line, ele)) {
    const proRataQuantityToAllocate = getProRataQuantityToAllocate(line, ele);
    data.updatedMaxPossibleReturnQuantity = new Decimal(ele.maxPossibleReturnQuantity).plus(proRataQuantityToAllocate).toNumber();

    if (!isQuantityAllocated(line)) {
      const unallocatedQuantity = proRataQuantityToAllocate.minus(line.quantityAllocated);

      data.updatedElementQuantity = new Decimal(ele.actualReturnQuantity).plus(unallocatedQuantity).toNumber();
      data.updatedLineQuantityAllocated = new Decimal(line.quantityAllocated).plus(unallocatedQuantity).toNumber();
    }
  }

  return data;
};

exports.getProRataQuantityToAllocate = getProRataQuantityToAllocate;
exports.doesLineOverlapChargeElementDateRange = doesLineOverlapChargeElementDateRange;
exports.matchReturnLineToElement = matchReturnLineToElement;
