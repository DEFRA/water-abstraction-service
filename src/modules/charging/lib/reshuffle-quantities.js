const { flatMap, uniq, identity } = require('lodash');
const moment = require('moment');
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});
const {
  getChargeElementReturnData,
  ERROR_OVER_ABSTRACTION
} = require('./two-part-tariff-helpers');
const { returns: { date: { isDateWithinAbstractionPeriod } } } = require('@envage/water-abstraction-helpers');

/**
 * Reduce function for calculating the total allocated quantity
 */
const getTotalActualQuantity = (total, element) => total.plus(element.actualReturnQuantity);

/**
 * Reduce function for calculating the total billable quantity
 */
const getTotalBillableQuantity = (total, element) => {
  return total.plus(element.proRataBillableQuantity || element.proRataAuthorisedQuantity);
};

/**
 * Return the pro rata billable quantity or the pro rata authorised quantity
 */
const getMaxAllowable = ele => ele.proRataBillableQuantity || ele.proRataAuthorisedQuantity;

/**
 * Checks whether or not the charge element is time limited, but checking if it has time limited dates
 */
const isTimeLimited = element => {
  const startDate = moment(element.timeLimitedStartDate || null); // if undefined is passed, moment defaults to now()
  const endDate = moment(element.timeLimitedEndDate || null);
  return startDate.isValid() && endDate.isValid();
};

/**
 * Filter charge elements for those containing the given purpose code
 */
const getAllChargeElementsForPurpose = (chargeElements, purpose) =>
  chargeElements.filter(ele => ele.purposeTertiary === purpose);

/**
   * Get a unique list of purposes across all charge elements
   */
const getAllChargeElementPurposes = chargeElements => {
  return uniq(chargeElements.map(ele => {
    return ele.purposeTertiary;
  }));
};

/**
 * Calculates the quantity to allocate for a charge element
 * @param {Decimal} totalActual return quantity to reshuffle
 * @param {Decimal} totalBillable quantity across charge elements
 * @param {Number} maxAllowable quantity for single charge element
 * @param {Number} maxForPeriod quantity for single charge element
 * @return {Object}
 *         {String} err  over abstraction error or null
 *         {Decimal} quantityToAllocate  for charge element
 */
const getQuantityToAllocate = (totalActual, totalBillable, maxAllowable, maxForPeriod) => {
  let err, quantityToAllocate;
  const overAbstraction = totalActual.minus(totalBillable);

  if (overAbstraction.gt(0)) {
    err = ERROR_OVER_ABSTRACTION;
    quantityToAllocate = overAbstraction.plus(maxAllowable);
  } else {
    quantityToAllocate = new Decimal(Math.min(totalActual, maxAllowable, maxForPeriod));
  }
  return {
    err,
    quantityToAllocate
  };
};

/**
 * Reallocate quantities to fill elements in order, over abstractions are allocated to first element
 * @param {Array} elements charge elements
 * @return {Array} of {error, data}
 *         {String} error  over abstraction error or null
 *         {Array} data containing further {error, data} objects
 */
const reallocateQuantitiesInOrder = chargeElementGroup => {
  const { baseElement, subElements } = chargeElementGroup;
  const elements = [baseElement, ...subElements];
  let totalBillable = elements.reduce(getTotalBillableQuantity, new Decimal(0));
  let totalActual = elements.reduce(getTotalActualQuantity, new Decimal(0));
  const overallErr = totalActual.minus(totalBillable).gt(0) ? ERROR_OVER_ABSTRACTION : null;

  const dataToReturn = elements.map(element => {
    const maxAllowableQuantity = getMaxAllowable(element);

    if (totalActual.isZero()) return getChargeElementReturnData({ ...element, actualReturnQuantity: 0 });

    const { err, quantityToAllocate } = getQuantityToAllocate(totalActual, totalBillable, maxAllowableQuantity, element.maxPossibleReturnQuantity);

    totalActual = totalActual.minus(quantityToAllocate);
    totalBillable = totalBillable.minus(maxAllowableQuantity);
    return getChargeElementReturnData({ ...element, actualReturnQuantity: quantityToAllocate }, err);
  });

  return { error: overallErr, data: dataToReturn };
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
 * Check that sub element abs period is within the base element abs period
 * @param {Object} subEle sub element
 * @param {Object} baseEle base element
 * @return {Boolean} whether or not the sub element is within the base element
 */
const isSubElementWithinBaseElement = (subEle, baseEle) => {
  const year = subEle.startDate.slice(0, 4);
  const options = {
    periodStartDay: baseEle.abstractionPeriodStartDay,
    periodStartMonth: baseEle.abstractionPeriodStartMonth,
    periodEndDay: baseEle.abstractionPeriodEndDay,
    periodEndMonth: baseEle.abstractionPeriodEndMonth
  };
  return isDateWithinAbstractionPeriod(`${year}-${subEle.abstractionPeriodStartMonth}-${subEle.abstractionPeriodStartDay}`, options) &&
    isDateWithinAbstractionPeriod(`${year}-${subEle.abstractionPeriodEndMonth}-${subEle.abstractionPeriodEndDay}`, options);
};

/**
 * Determine base elements and group with relevant sub elements
 * @param {Array} chargeElements for a given purpose
 * @return {Array} of base and subElements
 */
const sortElementsIntoGroupsForReallocation = chargeElements => {
  const baseElements = chargeElements.filter(element => !isTimeLimited(element));

  return baseElements.map(baseEle => {
    const subElements = chargeElements.filter(subEle => {
      const areFactorsMatching = subEle.source === baseEle.source && subEle.season === baseEle.season;
      return isTimeLimited(subEle) && areFactorsMatching && isSubElementWithinBaseElement(subEle, baseEle);
    });

    return { baseElement: baseEle, subElements };
  });
};

const isElementOverAbstracted = element => element.actualReturnQuantity > getMaxAllowable(element);

/**
 * Finds final allocation for elements in each element group
 * @param {Array} elementGroups charge elements grouped by purpose & source
 * @return {String} error over abstraction error or null
 *         {Array} data objects with final actualReturnQuantity determined
 */
const checkQuantitiesInElementGroups = elementGroups => {
  const matchedQuantities = [];
  const matchingErrors = [];

  elementGroups.forEach(group => {
    if (group.subElements.length === 0) {
      const error = isElementOverAbstracted(group.baseElement) ? ERROR_OVER_ABSTRACTION : null;
      matchingErrors.push(error);
      matchedQuantities.push(getChargeElementReturnData(group.baseElement, error));
    } else {
      const { error, data } = reallocateQuantitiesInOrder(group);
      matchingErrors.push(error);
      matchedQuantities.push(data);
    }
  });

  return {
    error: matchingErrors.filter(identity).shift() || null,
    data: flatMap(matchedQuantities)
  };
};

/**
 * Reshuffle quantities between charge elements so that they are filled in priority order
 * @param {Array} chargeElements
 * @return {Array} of {error, data}
 *         {String} error or null
 *         {Array} data containing further {error, data} objects
 */
const reshuffleQuantities = chargeElements => {
  const chargeElementPurposes = getAllChargeElementPurposes(chargeElements);
  const matchedQuantities = [];
  const matchingErrors = [];
  chargeElementPurposes.forEach(purpose => {
    const chargeElementsForPurpose = getAllChargeElementsForPurpose(chargeElements, purpose);

    const elementGroups = sortElementsIntoGroupsForReallocation(chargeElementsForPurpose);

    const { error, data } = checkQuantitiesInElementGroups(elementGroups);
    if (error) matchingErrors.push(error);

    matchedQuantities.push(...data);
  });

  return {
    error: (matchingErrors.length > 0) ? flatMap(uniq(matchingErrors)) : null,
    data: flatMap(matchedQuantities)
  };
};

exports.getQuantityToAllocate = getQuantityToAllocate;
exports.reallocateQuantitiesInOrder = reallocateQuantitiesInOrder;
exports.isTimeLimited = isTimeLimited;
exports.getElementsBySource = getElementsBySource;
exports.isSubElementWithinBaseElement = isSubElementWithinBaseElement;
exports.sortElementsIntoGroupsForReallocation = sortElementsIntoGroupsForReallocation;
exports.checkQuantitiesInElementGroups = checkQuantitiesInElementGroups;
exports.reshuffleQuantities = reshuffleQuantities;
