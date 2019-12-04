const { TPT_PURPOSES } = require('./two-part-tariff-helpers');
const { cloneDeep, sortBy } = require('lodash');
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});

/**
 * Filter charge elements for those which have a TPT purpose
 * @param {Object} chargeVersion contains the charge elements
 * @return {Array} charge elements with required data points for matching
 */
const getTptChargeElements = chargeElements => chargeElements.filter(element => {
  return TPT_PURPOSES.includes(parseInt(element.purposeTertiary));
});

/**
 * Pro rata the quantity - multiply by billable days & divide by total days
 */
const getProRataQuantity = (quantity, ele) => {
  return new Decimal(quantity)
    .times(ele.billableDays)
    .dividedBy(ele.totalDays)
    .toDecimalPlaces(3)
    .toNumber();
};

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
    ele.proRataAuthorisedQuantity = getProRataQuantity(ele.authorisedAnnualQuantity, ele);

    if (ele.billableAnnualQuantity) ele.proRataBillableQuantity = getProRataQuantity(ele.billableAnnualQuantity, ele);
  });
  return updated;
};

/**
 * Sorts charge elements by billableDays
 * @param {Array} chargeElements
 * @return {Array} sorted array of chargeElements
 */
const sortChargeElementsForMatching = chargeElements => sortBy(chargeElements, 'billableDays');

exports.getTptChargeElements = getTptChargeElements;
exports.prepareChargeElementData = prepareChargeElementData;
exports.sortChargeElementsForMatching = sortChargeElementsForMatching;
