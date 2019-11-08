const { sortBy, cloneDeep, partialRight, flatMap, uniq } = require('lodash');
const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});

const TPT_PURPOSES = [380, 390, 400, 410, 420];
const dateFormat = 'YYYY-MM-DD';

/**
 *
 * @param {moment} startDate of return or charge element
 * @param {moment} endDate of return or charge element
 * @param {Object} absDates abstraction dates
 * @param {String} absDates.periodStartDay - abstraction period start day of the month
 * @param {String} absDates.periodStartMonth - abstraction period start month
 * @param {String} absDates.periodEndDay - abstraction period end day of the month
 * @param {String} absDates.periodEndMonth - abstraction period end month
 * @return {moment range} absPeriod - abstraction period with years for given dates
 *
 */
const getAbsPeriod = (startDate, endDate, absDates) => {
  const { periodStartDay, periodStartMonth, periodEndDay, periodEndMonth } = absDates;
  const absStartYear = (new Decimal(periodStartMonth).gte(startDate.month() + 1)) ? startDate.year() : startDate.year() + 1;

  let absStartDate = moment({
    year: absStartYear,
    month: periodStartMonth - 1,
    days: periodStartDay
  });

  let absEndDate = moment({
    year: (new Decimal(periodStartMonth).gte(periodEndMonth)) ? absStartYear + 1 : absStartYear,
    month: periodEndMonth - 1,
    day: periodEndDay
  });
  // if abstraction period straddles the financial year, absPeriod will sometimes be a year ahead
  // this is a sense check for that situation
  if (absStartDate > endDate) {
    absStartDate.subtract(1, 'year');
    absEndDate.subtract(1, 'year');
  }
  return moment.range(absStartDate, absEndDate);
  ;
};

/**
 * Finds effective start & end dates for charge element taking into account
 * the abstraction period and start & end dates
 * @param {Object} ele - charge element
 * @return {Object}
 *   {String} effectiveStartDate - calculated start date as a string, formatted YYYY-MM-DD
 *   {String} effectiveEndDate - calculated end date as a string, formatted YYYY-MM-DD
 *
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
 * Finds pro rata authorised quantity for charge element
 * Adds effectiveStartDate, effectiveEndDate, actualAnnualQuantity & maxAllowableQuantity data points
 * @param {Array} chargeElements all charge elements in charge version
 * @return {Array} updated chargeElements array with new data points
 */
const prepChargeElements = chargeElements => {
  const updated = cloneDeep(chargeElements);
  updated.forEach(ele => {
    ele.actualAnnualQuantity = 0;
    const { effectiveStartDate, effectiveEndDate } = getEffectiveDates(ele);
    ele.effectiveStartDate = effectiveStartDate;
    ele.effectiveEndDate = effectiveEndDate;

    const allowableQuantity = new Decimal(ele.billableAnnualQuantity || ele.authorisedAnnualQuantity);
    ele.maxAllowableQuantity = allowableQuantity.times(ele.billableDays).dividedBy(ele.totalDays).toNumber();
  });
  return updated;
};

/**
 * Checks whether the specific return line is within the return abstraction period
 * @param {Object} ret - return which contains the return line
 * @param {Object} line - return line which is being compared against the return abstraction period
 * @return {Boolean} whether or not some or all of the line is within the abstraction period
 */
const isLineWithinAbstractionPeriod = (ret, line) => {
  const { nald } = ret.metadata;
  const startDate = moment(line.startDate);
  const endDate = moment(line.endDate);
  const absPeriod = getAbsPeriod(startDate, endDate, {
    periodStartDay: nald.periodStartDay,
    periodStartMonth: nald.periodStartMonth,
    periodEndDay: nald.periodEndDay,
    periodEndMonth: nald.periodEndMonth
  });

  return absPeriod.contains(startDate) || absPeriod.contains(endDate);
};

/**
 * Removes null and nil return lines, converts quantity to ML and adds quantityAllocated
 * @param {Array} returns objects
 * @return {Array} Updated returns array
 */
const prepareReturnLines = returns => {
  const updated = cloneDeep(returns);
  updated.forEach(ret => {
    ret.lines = ret.lines.filter(line => {
      return isLineWithinAbstractionPeriod(ret, line) ? line.quantity > 0 : false;
    });

    ret.lines.forEach(retLine => {
      retLine.quantityAllocated = 0;
      const quantity = new Decimal(retLine.quantity);
      retLine.quantity = quantity.dividedBy(1000).toNumber();
    });
  });
  return updated;
};

/**
 * Filter charge elements for those which have a TPT purpose
 * @param {Object} chargeVersion contains the charge elements
 * @return {Array} charge elements with required data points for matching
 */
const getTPTChargeElements = chargeVersion => {
  const { chargeElements } = chargeVersion;
  const tptChargeElements = chargeElements.filter(element => {
    return TPT_PURPOSES.includes(element.purposeTertiary);
  });
  return prepChargeElements(tptChargeElements);
};

/**
 * Sorts charge elements by billableDays
 * @param {Array} chargeElements
 * @return {Array} sorted array of chargeElements
 */
const sortChargeElementsForMatching = chargeElements => {
  return sortBy(chargeElements, 'billableDays');
};

/**
 * Check through all purposes for TPT purpose
 * @param {Array} purposes from return object
 * @return {Boolean} whether or not the return has a TPT purpose
 */
const checkReturnPurposes = purposes => {
  return purposes.map(purpose => {
    return TPT_PURPOSES.includes(parseInt(purpose.tertiary.code));
  });
};

/**
 * Filter returns for TPT purposes
 * @param {Array} returns objects
 * @return {Array} returns objects ready for matching with required data points
 */
const prepareReturns = returns => {
  const filteredReturns = returns.filter(ret => {
    const returnContainsTptPurpose = checkReturnPurposes(ret.metadata.purposes);
    return returnContainsTptPurpose.includes(true);
  });
  return prepareReturnLines(filteredReturns);
};

/**
 * Create moment range for return line or charge element
 * @param {Object} obj - return line or charge element
 * @return {moment range} date range for object passed in
 */
const getDateRange = obj => moment.range([
  moment(obj.startDate || obj.effectiveStartDate, dateFormat),
  moment(obj.endDate || obj.effectiveEndDate, dateFormat)
]);

/**
 * Return the number of days in a date range
 * @param {moment range} range
 * @return {Number} of days between start and end date of the range
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
 * Checks whether the return line overlaps the effective date range of the charge element
 * @param {Object} line return line
 * @param {Object} ele charge element
 * @return {Boolean} whether or not the return line overlaps the charge element
 */
const doesLineOverlapChargeElementDateRange = (line, ele) => {
  const lineRange = getDateRange(line);
  const eleRange = getDateRange(ele);
  return eleRange.overlaps(lineRange);
};

/**
 * Checks whether there is space in the allowable quantity in the charge element
 * @param {Object} chargeElement
 * @return {Boolean} whether or not allocated quantitiy is equal to allowable quantity
 */
const isChargeElementFull = chargeElement => chargeElement.actualAnnualQuantity === chargeElement.maxAllowableQuantity;

/**
 * Checks whether or not all of the return quantity has already been allocated
 * @param {Object} returnLine
 * @return {Boolean} whether or not the quantity is equal to the allocated quantity
 */
const isQuantityAllocated = returnLine => returnLine.quantity === returnLine.quantityAllocated;

/**
 * Checks and matches a return line against a charge element
 * @param {Object} line return line
 * @param {Object} ele charge element
 * @return {Object} updated element quantity & updated allocated quantity for return line
 */
const matchReturnLineToElement = (line, ele) => {
  const updatedEle = cloneDeep(ele);
  const updatedLine = cloneDeep(line);

  if (doesLineOverlapChargeElementDateRange(updatedLine, updatedEle)) {
    if (!isChargeElementFull(updatedEle) && !isQuantityAllocated(updatedLine)) {
      const proRataQuantity = getProRataQuantity(updatedLine, updatedEle);

      const unallocatedQuantity = proRataQuantity.minus(updatedLine.quantityAllocated);
      const remainingAllowableQuantity = new Decimal(updatedEle.maxAllowableQuantity).minus(updatedEle.actualAnnualQuantity);

      const quantityToBeAllocated = Math.min(unallocatedQuantity.toNumber(), remainingAllowableQuantity.toNumber());
      updatedEle.actualAnnualQuantity = new Decimal(updatedEle.actualAnnualQuantity).plus(quantityToBeAllocated).toNumber();
      updatedLine.quantityAllocated = new Decimal(updatedLine.quantityAllocated).plus(quantityToBeAllocated).toNumber();
    }
  }
  return {
    updatedElementQuantity: updatedEle.actualAnnualQuantity,
    updatedLineQuantityAllocated: updatedLine.quantityAllocated
  };
};

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
const getPriorityFunction = key => { return partialRight(getElementsBySource, ...prioritySorting[key]); };

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
 * Reduce function for calculating the total allocated quantity
 * @param {Decimal} total
 * @param {Object} element charge element
 * @return {Decimal} total plus the quantitiy of the charge element
 */
const getTotalActualQuantity = (total, element) => {
  return total.plus(element.actualAnnualQuantity);
};

/**
 * Get all purposes for charge elements
 * @param {Array} chargeElements
 * @return {Array} of unique purposes
 */
const getAllPurposes = chargeElements => {
  return uniq(chargeElements.map(ele => {
    return ele.purposeTertiary;
  }));
};

/**
 * Reshuffle quantities between charge elements so that they are filled in priority order
 * @param {Array} chargeElements
 * @return {Array} charge elements in priority order with final allocated quantities
 */
const reshuffleQuantities = chargeElements => {
  const chargeElementPurposes = getAllPurposes(chargeElements);
  const finalAllocatedElements = [];
  chargeElementPurposes.forEach(purpose => {
    const chargeElementsToPrioritise = chargeElements.filter(ele => { return ele.purposeTertiary === purpose; });
    const prioritisedElements = sortElementsInPriorityOrder(chargeElementsToPrioritise);

    let totalAllocatedQuantitity = prioritisedElements.reduce(getTotalActualQuantity, new Decimal(0));

    const allocatedElements = prioritisedElements.map(element => {
      if (totalAllocatedQuantitity.isZero()) { return element; }

      element.actualAnnualQuantity = totalAllocatedQuantitity.gte(element.maxAllowableQuantity)
        ? element.maxAllowableQuantity
        : totalAllocatedQuantitity.toNumber();

      totalAllocatedQuantitity = totalAllocatedQuantitity.minus(element.actualAnnualQuantity);

      return element;
    });
    finalAllocatedElements.push(allocatedElements);
  });
  return flatMap(finalAllocatedElements);
};

exports.getEffectiveDates = getEffectiveDates;
exports.prepChargeElements = prepChargeElements;
exports.getTPTChargeElements = getTPTChargeElements;
exports.sortChargeElementsForMatching = sortChargeElementsForMatching;
exports.prepareReturns = prepareReturns;
exports.prepareReturnLines = prepareReturnLines;
exports.getProRataQuantity = getProRataQuantity;
exports.doesLineOverlapChargeElementDateRange = doesLineOverlapChargeElementDateRange;
exports.matchReturnLineToElement = matchReturnLineToElement;
exports.isTimeLimited = isTimeLimited;
exports.sortElementsInPriorityOrder = sortElementsInPriorityOrder;
exports.reshuffleQuantities = reshuffleQuantities;
