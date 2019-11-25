const { flatMap, partialRight, uniq } = require('lodash');
const moment = require('moment');
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});

/**
 * Checks whether or not the charge element is time limited, but checking if it has time limited dates
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
 * Calls getElementsBySource with parameters from prioritySorting object
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
 */
const getTotalActualQuantity = (total, element) => {
  return total.plus(element.actualReturnQuantity);
};

/**
 * Reduce function for calculating the total billable quantity
 */
const getTotalBillableQuantity = (total, element) => {
  return total.plus(element.proRataBillableQuantity || element.proRataAuthorisedQuantity);
};

/**
 * Filter charge elements for those containing the given purpose code
 * @param {Array} chargeElements
 * @param {Integer} purpose code
 * @return {Array} of charge elements with the given purpose
 */
const getAllChargeElementsForPurpose = (chargeElements, purpose) =>
  chargeElements.filter(ele => ele.purposeTertiary === purpose);

const getQuantityToAllocate = (actualQuantity, maxAllowable) => {
  return actualQuantity.gte(maxAllowable)
    ? new Decimal(maxAllowable)
    : actualQuantity;
};

/**
 * Checks if total actual quantity is greater than total billable quantity
 */
const isOverAbstracted = (actual, billable) => actual.gt(billable);

/**
 * Return over abstraction error
 */
const getOverAbstractedErr = elements => {
  const elementIds = elements.map(ele => ele.chargeElementId);
  return {
    type: 'overAbstraction',
    msg: `Over abstraction reported on element/s ${elementIds.join(', ')}`
  };
};

/**
 * Reallocate quantities to fill elements in order, overabstractions are filled in same order
 * @param {Array} elements in order for reallocation
 * @return {Array} of {error, data}
 *        data.chargeElementId
 *        data.actualReturnQuantity
 */
const reallocateQuantitiesInPriorityOrder = (elements) => {
  let totalActual = elements.reduce(getTotalActualQuantity, new Decimal(0));
  let totalBillable = elements.reduce(getTotalBillableQuantity, new Decimal(0));
  const overAbstractedElementIds = [];

  const dataToReturn = elements.map(element => {
    const { chargeElementId, proRataBillableQuantity: elementBillable, proRataAuthorisedQuantity: elementAuthorised } = element;
    let quantityToAllocate;

    if (totalActual.isZero()) return { chargeElementId, actualReturnQuantity: 0 };

    if (isOverAbstracted(totalActual, totalBillable)) {
      const overAbstraction = totalActual.minus(totalBillable);
      const billableWithOverAbstraction = overAbstraction.plus(elementBillable);
      quantityToAllocate = getQuantityToAllocate(billableWithOverAbstraction, elementAuthorised);
      overAbstractedElementIds.push(chargeElementId);
    } else {
      quantityToAllocate = getQuantityToAllocate(totalActual, elementBillable || elementAuthorised);
    }

    totalActual = totalActual.minus(quantityToAllocate);
    totalBillable = totalBillable.minus(elementBillable || elementAuthorised);

    return {
      chargeElementId,
      actualReturnQuantity: quantityToAllocate.toDecimalPlaces(3).toNumber()
    };
  });

  return { error: (overAbstractedElementIds.length > 0) ? getOverAbstractedErr(overAbstractedElementIds) : null,
    data: dataToReturn };
};

/**
 * Reshuffle quantities between charge elements so that they are filled in priority order
 * @param {Array} chargeElements
 * @return {Array} of {error, data}
 *        data.chargeElementId
 *        data.actualReturnQuantity
 */
const reshuffleQuantities = chargeElements => {
  const chargeElementPurposes = getAllChargeElementPurposes(chargeElements);
  const matchedQuantities = [];
  const matchingErrors = [];
  chargeElementPurposes.forEach(purpose => {
    const chargeElementsToPrioritise = getAllChargeElementsForPurpose(chargeElements, purpose);

    const prioritisedElements = sortElementsInPriorityOrder(chargeElementsToPrioritise);

    const { error, data } = reallocateQuantitiesInPriorityOrder(prioritisedElements);
    if (error) matchingErrors.push(error);

    matchedQuantities.push(data);
  });
  return {
    error: flatMap(matchingErrors),
    data: flatMap(matchedQuantities)
  };
};

exports.isTimeLimited = isTimeLimited;
exports.getElementsBySource = getElementsBySource;
exports.sortElementsInPriorityOrder = sortElementsInPriorityOrder;
exports.reallocateQuantitiesInPriorityOrder = reallocateQuantitiesInPriorityOrder;
exports.reshuffleQuantities = reshuffleQuantities;
