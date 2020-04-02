const { flatMap, identity, groupBy } = require('lodash');
const Decimal = require('decimal.js-light');
const { getChargeElementReturnData } = require('./two-part-tariff-helpers');
const { twoPartTariffStatuses: { ERROR_OVER_ABSTRACTION } } = require('../../../../lib/models/transaction');
const { returns: { date: { isDateWithinAbstractionPeriod } } } = require('@envage/water-abstraction-helpers');

/**
 * Reduce function for calculating the total allocated quantity
 */
const getTotalActualQuantity = (total, element) => total.plus(element.actualReturnQuantity);

/**
 * Reduce function for calculating the total billable quantity
 */
const getTotalBillableQuantity = (total, element) => total.plus(element.proRataAuthorisedQuantity);

/**
 * Checks whether or not the charge element is time limited, but checking if it has time limited dates
 */
const isTimeLimited = element => !!element.timeLimitedPeriod;

/**
 * Reallocate quantities to fill elements in order, over abstractions are allocated to first element
 * @param {Array} elements charge elements
 * @return {Array} of {error, data}
 *         {String} error  over abstraction error or null
 *         {Array} data containing further {error, data} objects
 */
const reallocateQuantitiesInOrder = chargeElementGroup => {
  const elements = [chargeElementGroup.baseElement, ...chargeElementGroup.subElements];
  const totalBillable = elements.reduce(getTotalBillableQuantity, new Decimal(0));
  let totalActual = elements.reduce(getTotalActualQuantity, new Decimal(0));
  const overallErr = totalActual.minus(totalBillable).gt(0) ? ERROR_OVER_ABSTRACTION : null;

  const data = elements.map(element => {
    const quantityToAllocate = Math.min(totalActual, element.proRataAuthorisedQuantity, element.maxPossibleReturnQuantity);
    totalActual = totalActual.minus(quantityToAllocate);
    return getChargeElementReturnData({ ...element, actualReturnQuantity: quantityToAllocate }, null);
  });

  // if there's any unallocated quantity left, add over abstraction amount to first element
  if (totalActual.gt(0)) {
    data[0].data.actualReturnQuantity = totalActual.plus(data[0].data.actualReturnQuantity).toDecimalPlaces(3).toNumber();
    data[0].error = overallErr;
  }
  return { data, error: overallErr };
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
    periodStartDay: baseEle.abstractionPeriod.startDay,
    periodStartMonth: baseEle.abstractionPeriod.startMonth,
    periodEndDay: baseEle.abstractionPeriod.endDay,
    periodEndMonth: baseEle.abstractionPeriod.endMonth
  };
  return isDateWithinAbstractionPeriod(`${year}-${subEle.abstractionPeriod.startMonth}-${subEle.abstractionPeriod.startDay}`, options) &&
    isDateWithinAbstractionPeriod(`${year}-${subEle.abstractionPeriod.endMonth}-${subEle.abstractionPeriod.endDay}`, options);
};

/**
 * Determine base elements and group with relevant sub elements
 * @param {Array} chargeElements for a given purpose
 * @return {Array} of base and subElements
 */
const sortElementsIntoGroupsForReallocation = chargeElements => {
  const baseElements = chargeElements.filter(element => !isTimeLimited(element));

  return baseElements.map(baseEle => {
    const groupedElements = groupBy(chargeElements, ele => {
      const areFactorsMatching = ele.source === baseEle.source && ele.season === baseEle.season && ele.purposeUse.code === baseEle.purposeUse.code;
      return (isTimeLimited(ele) && areFactorsMatching && isSubElementWithinBaseElement(ele, baseEle)) ? 'subElements' : 'notMatching';
    });

    return { baseElement: baseEle, subElements: groupedElements.subElements || [] };
  });
};

/**
 * Calls reallocateQuantitiesInOrder & organises return values in arrays
 * @param {Array} elementGroups charge elements grouped by purpose & source
 * @return {String} error over abstraction error or null
 *         {Array} data objects with final actualReturnQuantity determined
 */
const checkQuantitiesInElementGroups = elementGroups => {
  const matchedQuantities = [];
  const matchingErrors = [];

  elementGroups.forEach(group => {
    const { error, data } = reallocateQuantitiesInOrder(group);
    matchingErrors.push(error);
    matchedQuantities.push(data);
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
  const elementGroups = sortElementsIntoGroupsForReallocation(chargeElements);
  return checkQuantitiesInElementGroups(elementGroups);
};

exports.reallocateQuantitiesInOrder = reallocateQuantitiesInOrder;
exports.isTimeLimited = isTimeLimited;
exports.isSubElementWithinBaseElement = isSubElementWithinBaseElement;
exports.sortElementsIntoGroupsForReallocation = sortElementsIntoGroupsForReallocation;
exports.checkQuantitiesInElementGroups = checkQuantitiesInElementGroups;
exports.reshuffleQuantities = reshuffleQuantities;
