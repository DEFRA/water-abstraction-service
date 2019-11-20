const { flatMap, partialRight, uniq } = require('lodash');
const moment = require('moment');
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});

/**
 * Checks whether or not the charge element is time limited
 * @param {Object} element charge element
 * @return {Boolean} whether or not the time limited start and end dates are valid dates
 */
const isTimeLimited = element => {
  const startDate = moment(element.timeLimitedStartDate || null); // if undefined is passed, moment defaults to now()
  const endDate = moment(element.timeLimitedEndDate || null);
  return startDate.isValid() && endDate.isValid();
};

/**
 * Filters the charge elements by source and whether or not they are time limited
 * @param {Array} chargeElements
 * @param {String} source - supported or unsupported
 * @param {Boolean} timeLimited - whether filter for an element that is time limited
 * @return {Array} filtered charge elements based on source and time limited
 */
const getElementsBySource = (chargeElements, source, timeLimited) => {
  return chargeElements.filter(element => {
    if (timeLimited) {
      return element.source === source && isTimeLimited(element);
    }
    return element.source === source && !isTimeLimited(element);
  });
};

/**
 * Source and time limited factors in order of final sorting priority
 */
const prioritySorting = {
  unsupportedSource: ['unsupported', false],
  unsupportedTimeLimited: ['unsupported', true],
  supportedSource: ['supported', false],
  supportedTimeLimited: ['supported', true]
};

/**
 * Calls functions listed in prioritySorting object above
 * @param {String} key from prioritySorting object
 */
const getPriorityFunction = key => {
  return partialRight(getElementsBySource, ...prioritySorting[key]);
};

/**
 * Sorting function to sort charge elements in descending order of billable days
 * @param {Object} element1 charge element to sort by billable days
 * @param {Object} element2 charge element to sort by billable days
 * @return {Number} difference in billable days for the sorting algorithm
 */
const sortByDescBillableDays = (element1, element2) => {
  return element2.billableDays - element1.billableDays;
};

/**
 * Sort charge elements in priority order for output
 * @param {Array} chargeElements
 * @return {Array} sorted charge elements
 */
const sortElementsInPriorityOrder = chargeElements => {
  const prioritisedElements = [];
  Object.keys(prioritySorting).forEach(key => {
    const methodToCall = getPriorityFunction(key);
    let elementsToBeAdded = methodToCall(chargeElements);
    if (elementsToBeAdded.length > 1) {
      elementsToBeAdded = elementsToBeAdded.sort(sortByDescBillableDays);
    }
    prioritisedElements.push(elementsToBeAdded);
  });
  return flatMap(prioritisedElements);
};

/**
 * Get all purposes for charge elements
 * @param {Array} chargeElements
 * @return {Array} of unique purposes
 */
const getAllChargeElementPurposes = chargeElements => {
  return uniq(chargeElements.map(ele => {
    return ele.purposeTertiary;
  }));
};

/**
 * Reduce function for calculating the total allocated quantity
 * @param {Decimal} total
 * @param {Object} element charge element
 * @return {Decimal} total plus the quantitiy of the charge element
 */
const getTotalActualQuantity = (total, element) => {
  return total.plus(element.actualAnnualQuantity);
};

/**
 * Filter charge elements for those containing the given purpose code
 * @param {Array} chargeElements
 * @param {Integer} purpose code
 * @return {Array} of charge elements with the given purpose
 */
const getAllChargeElementsForPurpose = (chargeElements, purpose) =>
  chargeElements.filter(ele => ele.purposeTertiary === purpose);

/**
   * Sum up allocated quantities and reallocate to charge elements in order
   * @param {Array} chargeElements
   * @return {Array} charge elements with reshuffled quantities
   */
const reallocateQuantityInPriorityOrder = chargeElements => {
  let totalAllocatedQuantitity = chargeElements.reduce(getTotalActualQuantity, new Decimal(0));

  return chargeElements.map(element => {
    if (totalAllocatedQuantitity.isZero()) {
      return element;
    }

    const quantityToAllocate = totalAllocatedQuantitity.gte(element.maxAllowableQuantity)
      ? new Decimal(element.maxAllowableQuantity)
      : totalAllocatedQuantitity;

    totalAllocatedQuantitity = totalAllocatedQuantitity.minus(quantityToAllocate);

    return {
      ...element,
      actualAnnualQuantity: quantityToAllocate.toDecimalPlaces(3).toNumber()
    };
  });
};

/**
 * Reshuffle quantities between charge elements so that they are filled in priority order
 * @param {Array} chargeElements
 * @return {Array} charge elements in priority order with final allocated quantities
 */
const reshuffleQuantities = chargeElements => {
  const chargeElementPurposes = getAllChargeElementPurposes(chargeElements);
  const finalAllocatedElements = [];
  chargeElementPurposes.forEach(purpose => {
    const chargeElementsToPrioritise = getAllChargeElementsForPurpose(chargeElements, purpose);

    const prioritisedElements = sortElementsInPriorityOrder(chargeElementsToPrioritise);

    const allocatedElements = reallocateQuantityInPriorityOrder(prioritisedElements);

    finalAllocatedElements.push(allocatedElements);
  });
  return flatMap(finalAllocatedElements);
};

exports.isTimeLimited = isTimeLimited;
exports.sortElementsInPriorityOrder = sortElementsInPriorityOrder;
exports.reshuffleQuantities = reshuffleQuantities;
