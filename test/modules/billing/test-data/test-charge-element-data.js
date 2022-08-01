const defaults = {
  abstractionPeriodStartDay: 1,
  abstractionPeriodStartMonth: 1,
  abstractionPeriodEndDay: 31,
  abstractionPeriodEndMonth: 12
}

const createChargeElement = (opts = {}) => {
  const options = Object.assign({}, defaults, opts)
  const chargeElement = {
    id: options.chargeElementId || 'charge-element-id',
    abstractionPeriod: {
      startDay: options.abstractionPeriodStartDay,
      startMonth: options.abstractionPeriodStartMonth,
      endDay: options.abstractionPeriodEndDay,
      endMonth: options.abstractionPeriodEndMonth
    },
    actualReturnQuantity: options.actualReturnQuantity,
    authorisedAnnualQuantity: options.authorisedAnnualQuantity,
    season: options.season,
    source: options.source,
    loss: options.loss,
    billableAnnualQuantity: options.billableAnnualQuantity,
    description: 'Borehole-NGR XX 123 456. Summer Spray Irrigation.',
    srocCategory: null,
    dateCreated: '2019-08-15T04:43:45.234Z',
    dateUpdated: '2019-09-27T10:23:07.981Z',
    proRataAuthorisedQuantity: options.proRataAuthorisedQuantity,
    maxPossibleReturnQuantity: options.maxPossibleReturnQuantity,
    startDate: options.startDate,
    endDate: options.endDate,
    // Number of days this charge element would have been billable for
    // had it been in effect for the whole financial year.
    // Takes the abstraction period into account
    totalDays: options.totalDays,
    // Number of days this charge element is billable for, taking into
    // account the abstraction period and the date range of the element
    billableDays: options.billableDays,
    purposeUse: {
      type: 'use',
      code: options.purposeUseCode,
      name: 'Spray Irrigation - Direct',
      isTwoPartTariff: options.isTwoPartTariff
    }
  }

  if (options.timeLimitedStartDate || options.timeLimitedEndDate) {
    chargeElement.timeLimitedPeriod = {
      startDate: options.timeLimitedStartDate,
      endDate: options.timeLimitedEndDate
    }
  }

  return chargeElement
}

exports.createChargeElement = createChargeElement
