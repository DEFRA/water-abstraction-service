const chargeVersion = {
  chargeVersionId: 'charge-version-1',
  licenceRef: 'licence-ref',
  scheme: 'alcs',
  versionNumber: 108,
  startDate: '2017-12-06T00:00:00.000Z',
  status: 'current',
  apportionment: false,
  error: false,
  endDate: null,
  billedUptoDate: '2020-03-30T23:00:00.000Z',
  regionCode: 1,
  dateCreated: '2019-09-26T08:12:02.492Z',
  dateUpdated: '2019-09-26T08:12:02.492Z',
  source: 'nald',
  chargeElements: [{
    chargeElementId: 'charge-element-1',
    chargeVersionId: 'charge-version-1',
    abstractionPeriodStartDay: 1,
    abstractionPeriodStartMonth: 4,
    abstractionPeriodEndDay: 31,
    abstractionPeriodEndMonth: 3,
    startDate: '2017-04-01',
    endDate: '2018-03-31',
    totalDays: 365,
    billableDays: 365,
    authorisedAnnualQuantity: '112.2',
    season: 'summer',
    seasonDerived: 'summer',
    source: 'unsupported',
    loss: 'high',
    purposePrimary: 'A',
    purposeSecondary: 'AGR',
    purposeTertiary: '420',
    factorsOverridden: false,
    billableAnnualQuantity: '56.1',
    timeLimitedStartDate: null,
    timeLimitedEndDate: null,
    description: 'Big field',
    srocCategory: null,
    dateCreated: '2019-09-26T08:12:08.346Z',
    dateUpdated: '2019-09-26T08:12:08.346Z',
    purposePrimaryDescription: 'Agriculture',
    purposeSecondaryDescription: 'General Agriculture',
    purposeTertiaryDescription: 'Spray Irrigation - Storage',
    eiucSource: 'other',
    chargeAgreements: [{
      chargeAgreementId: 'charge-agreement-1',
      chargeElementId: 'charge-element-1',
      agreementCode: 'S127',
      startDate: '2017-12-06T00:00:00.000Z',
      endDate: null,
      signedDate: null,
      fileReference: null,
      description: null,
      dateCreated: '2019-09-26T08:12:17.107Z',
      dateUpdated: '2019-09-26T08:12:17.107Z',
      agreementDescription: 'Section 127 (Two Part Tariff)'
    }]
  }]
};

const returns = [{
  returnId: 'return-1',
  licenceNumber: 'licence-ref',
  receivedDate: '2018-04-17',
  startDate: '2017-04-01',
  endDate: '2017-12-05',
  dueDate: '2018-04-28',
  frequency: 'month',
  isNil: false,
  status: 'completed',
  versionNumber: 1,
  isCurrent: true,
  reading: {
    type: null,
    method: null,
    units: 'm³',
    totalFlag: null,
    total: null,
    totalCustomDates: false,
    totalCustomDateStart: null,
    totalCustomDateEnd: null
  },
  meters: [],
  requiredLines: null,
  lines: [{
    startDate: '2017-04-01',
    endDate: '2017-04-30',
    quantity: 8594,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-05-01',
    endDate: '2017-05-31',
    quantity: 17494,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-06-01',
    endDate: '2017-06-30',
    quantity: 20356,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-07-01',
    endDate: '2017-07-31',
    quantity: 365,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-08-01',
    endDate: '2017-08-31',
    quantity: 6885,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-09-01',
    endDate: '2017-09-30',
    quantity: 0,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-10-01',
    endDate: '2017-10-31',
    quantity: 0,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-11-01',
    endDate: '2017-11-30',
    quantity: 0,
    timePeriod: 'month',
    readingType: 'measured'
  }
  ],
  metadata: {
    nald: {
      periodEndDay: '31',
      periodEndMonth: '12',
      periodStartDay: '1',
      periodStartMonth: '1'
    },
    points: [{
      name: 'Big field',
      ngr1: 'XX 123 456',
      ngr2: null,
      ngr3: null,
      ngr4: null
    }],
    isFinal: true,
    version: 1,
    isSummer: false,
    isUpload: false,
    purposes: [{
      primary: {
        code: 'A',
        description: 'Agriculture'
      },
      tertiary: {
        code: '420',
        description: 'Spray Irrigation - Storage'
      },
      secondary: {
        code: 'AGR',
        description: 'General Agriculture'
      }
    },
    {
      primary: {
        code: 'A',
        description: 'Agriculture'
      },
      tertiary: {
        code: '400',
        description: 'Spray Irrigation - Direct'
      },
      secondary: {
        code: 'AGR',
        description: 'General Agriculture'
      }
    }
    ],
    isCurrent: true,
    description: 'Big field',
    isTwoPartTariff: true
  },
  versions: [{
    versionNumber: 1,
    isCurrent: true
  }],
  isUnderQuery: false
}];

module.exports = {
  chargeVersion,
  returns
};
