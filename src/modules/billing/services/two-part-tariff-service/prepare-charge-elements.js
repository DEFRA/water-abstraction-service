const { sortBy } = require('lodash');
const Decimal = require('decimal.js-light');

/**
 * Filter charge elements for those which have a TPT purpose
 * @param {Object} chargeVersion contains the charge elements
 * @return {Array} charge elements with required data points for matching
 */
const getTptChargeElements = chargeElements =>
  chargeElements.filter(element => element.purposeUse.isTwoPartTariff);

/**
 * Pro rata the quantity - multiply by billable days & divide by total days
 */
const getProRataQuantity = (ele) => new Decimal(ele.billableAnnualQuantity || ele.authorisedAnnualQuantity)
  .times(ele.billableDays)
  .dividedBy(ele.totalDays)
  .toDecimalPlaces(3)
  .toNumber();

/**
 * Find pro rata authorised quantity for charge element
 * Add effectiveStartDate, effectiveEndDate, actualReturnQuantity
 * & proRataAuthorisedQuantity data points
 * @param {Array} chargeElements all charge elements in charge version
 * @return {Array} updated chargeElements array with new data points
 */
const prepareChargeElementData = chargeElements => chargeElements.map(ele => {
  return {
    ...ele,
    actualReturnQuantity: 0,
    maxPossibleReturnQuantity: 0,
    proRataAuthorisedQuantity: getProRataQuantity(ele)
  };
});

/**
 * Sorts charge elements by billableDays
 * @param {Array} chargeElements
 * @return {Array} sorted array of chargeElements
 */
const sortChargeElementsForMatching = chargeElements => sortBy(chargeElements, 'billableDays');

exports.getTptChargeElements = getTptChargeElements;
exports.prepareChargeElementData = prepareChargeElementData;
exports.sortChargeElementsForMatching = sortChargeElementsForMatching;
