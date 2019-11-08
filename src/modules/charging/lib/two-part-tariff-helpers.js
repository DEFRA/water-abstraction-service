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
  return {
    absPeriod: moment.range(absStartDate, absEndDate),
    absStartDate,
    absEndDate
  }
  ;
};

const getEffectiveDates = (ele) => {
  const startDate = moment(ele.startDate, dateFormat);
  const endDate = moment(ele.endDate, dateFormat);
  const { absPeriod, absStartDate, absEndDate } = getAbsPeriod(startDate, endDate, {
    periodStartDay: ele.abstractionPeriodStartDay,
    periodStartMonth: ele.abstractionPeriodStartMonth,
    periodEndDay: ele.abstractionPeriodEndDay,
    periodEndMonth: ele.abstractionPeriodEndMonth
  });
  return {
    effectiveStartDate: absPeriod.contains(startDate) ? startDate.format(dateFormat) : absStartDate.format(dateFormat),
    effectiveEndDate: absPeriod.contains(endDate)
      ? endDate.format(dateFormat)
      : (endDate <= absStartDate) ? absEndDate.subtract(1, 'year').format(dateFormat) : absEndDate.format(dateFormat)
  };
};

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
const isLineWithinAbstractionPeriod = (ret, line) => {
  const { nald } = ret.metadata;
  const startDate = moment(line.startDate);
  const endDate = moment(line.endDate);
  const { absPeriod } = getAbsPeriod(startDate, endDate, {
    periodStartDay: nald.periodStartDay,
    periodStartMonth: nald.periodStartMonth,
    periodEndDay: nald.periodEndDay,
    periodEndMonth: nald.periodEndMonth
  });

  return absPeriod.contains(startDate) || absPeriod.contains(endDate);
};

/**
 * Removes null and nil return lines, converts quantity to ML and adds quantityAllocated
 * @param {Array} returns
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

const getTPTChargeElements = chargeVersion => {
  const { chargeElements } = chargeVersion;
  const tptChargeElements = chargeElements.filter(element => {
    return TPT_PURPOSES.includes(element.purposeTertiary);
  });
  return prepChargeElements(tptChargeElements);
};

const prepareChargeElementsForMatching = chargeElements => {
  return sortBy(chargeElements, 'billableDays');
};

const checkReturnPurposes = purposes => {
  return purposes.map(purpose => {
    return TPT_PURPOSES.includes(parseInt(purpose.tertiary.code));
  });
};

const prepareReturns = returns => {
  const filteredReturns = returns.filter(ret => {
    const returnContainsTptPurpose = checkReturnPurposes(ret.metadata.purposes);
    return returnContainsTptPurpose.includes(true);
  });
  return prepareReturnLines(filteredReturns);
};

const getLineDateRange = line => moment.range([
  moment(line.startDate, dateFormat),
  moment(line.endDate, dateFormat)
]);

const getChargeElementDateRange = ele => moment.range([
  moment(ele.effectiveStartDate, dateFormat),
  moment(ele.effectiveEndDate, dateFormat)
]);

const getNumberOfDaysInRange = range => range.end.diff(range.start, 'days') + 1;

const getProRataQuantity = (line, ele) => {
  const lineRange = getLineDateRange(line);
  const eleRange = getChargeElementDateRange(ele);
  const intersectionOfRanges = eleRange.intersect(lineRange);
  const abstractionDaysInChargeElement = getNumberOfDaysInRange(intersectionOfRanges);
  const totalAbstractionDays = getNumberOfDaysInRange(lineRange);

  const proRataFactor = new Decimal(abstractionDaysInChargeElement / totalAbstractionDays);
  return proRataFactor.times(line.quantity);
};

const doesLineOverlapChargeElementDateRange = (line, ele) => {
  const lineRange = getLineDateRange(line);
  const eleRange = getChargeElementDateRange(ele);
  return eleRange.overlaps(lineRange);
};

const isChargeElementFull = chargeElement => chargeElement.actualAnnualQuantity === chargeElement.maxAllowableQuantity;
const isQuantityAllocated = returnLine => returnLine.quantity === returnLine.quantityAllocated;

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

const isTimeLimited = element => {
  const startDate = moment(element.timeLimitedStartDate || null); // if undefined is passed, moment defaults to now()
  const endDate = moment(element.timeLimitedEndDate || null);
  return startDate.isValid() && endDate.isValid();
};

const getElementsBySource = (chargeElements, source, timeLimited) => {
  return chargeElements.filter(element => {
    if (timeLimited) {
      return element.source === source && isTimeLimited(element);
    }
    return element.source === source && !isTimeLimited(element);
  });
};

const prioritySorting = {
  unsupportedSource: ['unsupported', false],
  unsupportedTimeLimited: ['unsupported', true],
  supportedSource: ['supported', false],
  supportedTimeLimited: ['supported', true]
};

const getPriorityFunction = key => { return partialRight(getElementsBySource, ...prioritySorting[key]); };

const sortByDescBillableDays = (element1, element2) => {
  return element2.billableDays - element1.billableDays;
};

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

const getTotalActualQuantity = (total, element) => {
  return total.plus(element.actualAnnualQuantity);
};

const getAllPurposes = chargeElements => {
  return uniq(chargeElements.map(ele => {
    return ele.purposeTertiary;
  }));
};

const reshuffleQuantities = chargeElements => {
  const chargeElementPurposes = getAllPurposes(chargeElements);
  const finalAllocatedElements = [];
  chargeElementPurposes.forEach(purpose => {
    const chargeElementsToPrioritise = chargeElements.filter(ele => { return ele.purposeTertiary === purpose; });
    const prioritisedElements = sortElementsInPriorityOrder(chargeElementsToPrioritise);

    let totalAllocatedQuantitity = prioritisedElements.reduce(getTotalActualQuantity, new Decimal(0));

    const allocatedElements = prioritisedElements.map(element => {
      if (totalAllocatedQuantitity.isZero()) { return element; }

      if (totalAllocatedQuantitity.gte(element.maxAllowableQuantity)) {
        element.actualAnnualQuantity = element.maxAllowableQuantity;
      } else {
        element.actualAnnualQuantity = totalAllocatedQuantitity.toNumber();
      }
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
exports.prepareChargeElementsForMatching = prepareChargeElementsForMatching;
exports.prepareReturns = prepareReturns;
exports.prepareReturnLines = prepareReturnLines;
exports.getProRataQuantity = getProRataQuantity;
exports.doesLineOverlapChargeElementDateRange = doesLineOverlapChargeElementDateRange;
exports.matchReturnLineToElement = matchReturnLineToElement;
exports.isTimeLimited = isTimeLimited;
exports.sortElementsInPriorityOrder = sortElementsInPriorityOrder;
exports.reshuffleQuantities = reshuffleQuantities;
