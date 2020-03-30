const { flatMap, identity, groupBy } = require('lodash');
const Decimal = require('decimal.js-light');
const { getChargeElementReturnData } = require('./two-part-tariff-helpers');
const { twoPartTariffStatuses: { ERROR_OVER_ABSTRACTION } } = require('../../../../lib/models/transaction');
const { returns: { date: { isDateWithinAbstractionPeriod } } } = require('@envage/water-abstraction-helpers');

const dateRegex = new RegExp(/^\d{4}-\d{2}-\d{2}$/);

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
const isTimeLimited = element => dateRegex.test(element.timeLimitedStartDate) && dateRegex.test(element.timeLimitedEndDate);

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
  const elements = [chargeElementGroup.baseElement, ...chargeElementGroup.subElements];
  const totalBillable = elements.reduce(getTotalBillableQuantity, new Decimal(0));
  let totalActual = elements.reduce(getTotalActualQuantity, new Decimal(0));
  const overallErr = totalActual.minus(totalBillable).gt(0) ? ERROR_OVER_ABSTRACTION : null;

  const data = elements.map(element => {
    const quantityToAllocate = Math.min(totalActual, element.proRataAuthorisedQuantity, element.maxPossibleReturnQuantity);
    totalActual = totalActual.minus(quantityToAllocate);
    return getChargeElementReturnData({ ...element, actualReturnQuantity: quantityToAllocate }, null);
  });

  if (totalActual.gt(0)) {
    data[0].data.actualReturnQuantity = totalActual.plus(data[0].data.actualReturnQuantity).toDecimalPlaces(3).toNumber();
    data[0].error = overallErr;
  }
  return { data, error: overallErr };
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
    const groupedElements = groupBy(chargeElements, ele => {
      const areFactorsMatching = ele.source === baseEle.source && ele.season === baseEle.season && ele.purposeTertiary === baseEle.purposeTertiary;
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

exports.getQuantityToAllocate = getQuantityToAllocate;
exports.reallocateQuantitiesInOrder = reallocateQuantitiesInOrder;
exports.isTimeLimited = isTimeLimited;
exports.getElementsBySource = getElementsBySource;
exports.isSubElementWithinBaseElement = isSubElementWithinBaseElement;
exports.sortElementsIntoGroupsForReallocation = sortElementsIntoGroupsForReallocation;
exports.checkQuantitiesInElementGroups = checkQuantitiesInElementGroups;
exports.reshuffleQuantities = reshuffleQuantities;
