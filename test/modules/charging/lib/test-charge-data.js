const createChargeElement = options => {
  return {
    chargeElementId: options.chargeElementId || 'charge-element-id',
    chargeVersionId: 'charge-version-id',
    abstractionPeriodStartDay: options.abstractionPeriodStartDay,
    abstractionPeriodStartMonth: options.abstractionPeriodStartMonth,
    abstractionPeriodEndDay: options.abstractionPeriodEndDay,
    abstractionPeriodEndMonth: options.abstractionPeriodEndMonth,
    actualReturnQuantity: options.actualReturnQuantity,
    authorisedAnnualQuantity: options.authorisedAnnualQuantity,
    season: options.season,
    seasonDerived: options.seasonDerived,
    source: options.source,
    loss: options.loss,
    purposePrimary: 'A',
    purposeSecondary: 'AGR',
    purposeTertiary: options.purposeTertiary,
    factorsOverridden: false,
    billableAnnualQuantity: options.billableAnnualQuantity,
    timeLimitedStartDate: options.timeLimitedStartDate,
    timeLimitedEndDate: options.timeLimitedEndDate,
    description: 'Borehole-NGR XX 123 456. Summer Spray Irrigation.',
    srocCategory: null,
    dateCreated: '2019-08-15T04:43:45.234Z',
    dateUpdated: '2019-09-27T10:23:07.981Z',
    proRataAuthorisedQuantity: options.proRataAuthorisedQuantity,
    proRataBillableQuantity: options.proRataBillableQuantity,
    purposePrimaryDescription: 'Agriculture',
    purposeSecondaryDescription: 'General Agriculture',
    purposeTertiaryDescription: 'Spray Irrigation - Direct',
    startDate: options.startDate,
    endDate: options.endDate,
    effectiveEndDate: options.effectiveEndDate,
    effectiveStartDate: options.effectiveStartDate,
    // Number of days this charge element would have been billable for
    // had it been in effect for the whole financial year.
    // Takes the abstraction period into account
    totalDays: options.totalDays,
    // Number of days this charge element is billable for, taking into
    // account the abstraction period and the date range of the element
    billableDays: options.billableDays
  };
};

const wrapElementsInVersion = (chargeElements, startDate, endDate) => {
  return {
    chargeVersion: {
      licenceRef: '6/33/53/*S/0153'
    },
    financialYear: {
      startDate: '2016-04-01',
      endDate: '2017-03-31'
    },
    startDate: startDate,
    endDate: endDate,
    chargeElements: chargeElements
  };
};

exports.createChargeElement = createChargeElement;
exports.wrapElementsInVersion = wrapElementsInVersion;
