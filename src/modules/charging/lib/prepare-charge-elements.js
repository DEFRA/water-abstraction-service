const { TPT_PURPOSES, dateFormat, getAbsPeriod } = require('./two-part-tariff-helpers');
const { cloneDeep, sortBy } = require('lodash');
const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});

/**
 * Filter charge elements for those which have a TPT purpose
 * @param {Object} chargeVersion contains the charge elements
 * @return {Array} charge elements with required data points for matching
 */
const getTPTChargeElements = chargeElements => chargeElements.filter(element => {
  return TPT_PURPOSES.includes(element.purposeTertiary);
});

/**
 * Find pro rata authorised quantity for charge element
 * Add effectiveStartDate, effectiveEndDate, actualReturnQuantity,
 * proRataBillableQuantity & proRataAuthorisedQuantity data points
 * @param {Array} chargeElements all charge elements in charge version
 * @return {Array} updated chargeElements array with new data points
 */
const prepareChargeElementData = chargeElements => {
  const updated = cloneDeep(chargeElements);
  updated.forEach(ele => {
    ele.actualReturnQuantity = 0;
    const { effectiveStartDate, effectiveEndDate } = getEffectiveDates(ele);
    ele.effectiveStartDate = effectiveStartDate;
    ele.effectiveEndDate = effectiveEndDate;
    ele.proRataAuthorisedQuantity = new Decimal(ele.authorisedAnnualQuantity).times(ele.billableDays).dividedBy(ele.totalDays).toDecimalPlaces(3).toNumber();

    if (ele.billableAnnualQuantity) ele.proRataBillableQuantity = new Decimal(ele.billableAnnualQuantity).times(ele.billableDays).dividedBy(ele.totalDays).toDecimalPlaces(3).toNumber();
  });
  return updated;
};

/**
 * Finds effective start & end dates for charge element taking into account
 * the abstraction period and start & end dates
 * @param {Object} ele - charge element
 * @return {Object}
 *   {String} effectiveStartDate - calculated start date as a string, formatted YYYY-MM-DD
 *   {String} effectiveEndDate - calculated end date as a string, formatted YYYY-MM-DD
 */
const getEffectiveDates = (ele) => {
  const startDate = moment(ele.startDate, dateFormat);
  const endDate = moment(ele.endDate, dateFormat);
  const absPeriod = getAbsPeriod(startDate, endDate, {
    periodStartDay: ele.abstractionPeriodStartDay,
    periodStartMonth: ele.abstractionPeriodStartMonth,
    periodEndDay: ele.abstractionPeriodEndDay,
    periodEndMonth: ele.abstractionPeriodEndMonth
  });

  const absStartDate = absPeriod.start;
  const absEndDate = absPeriod.end;

  return {
    effectiveStartDate: absPeriod.contains(startDate) ? startDate.format(dateFormat) : absStartDate.format(dateFormat),
    effectiveEndDate: absPeriod.contains(endDate)
      ? endDate.format(dateFormat)
      : (endDate <= absStartDate) ? absEndDate.subtract(1, 'year').format(dateFormat) : absEndDate.format(dateFormat)
  };
};

/**
 * Sorts charge elements by billableDays
 * @param {Array} chargeElements
 * @return {Array} sorted array of chargeElements
 */
const sortChargeElementsForMatching = chargeElements => {
  return sortBy(chargeElements, 'billableDays');
};

exports.getTPTChargeElements = getTPTChargeElements;
exports.prepareChargeElementData = prepareChargeElementData;
exports.getEffectiveDates = getEffectiveDates;
exports.sortChargeElementsForMatching = sortChargeElementsForMatching;
