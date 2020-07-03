const chargeElements = [
  {
    id: 'charge-element-1',
    abstractionPeriod: {
      startDay: 1,
      startMonth: 11,
      endDay: 31,
      endMonth: 3
    },
    startDate: '2017-10-12',
    endDate: '2018-03-31',
    totalDays: 171,
    billableDays: 151,
    authorisedAnnualQuantity: '82',
    season: 'winter',
    source: 'unsupported',
    loss: 'high',
    purposeUse: {
      type: 'use',
      code: '420',
      name: 'Spray Irrigation - Storage',
      isTwoPartTariff: true
    },
    factorsOverridden: false,
    billableAnnualQuantity: null,
    timeLimitedPeriod: {
      startDate: '2017-10-11T23:00:00.000Z',
      endDate: '2030-03-31T00:00:00.000Z'
    },
    description: 'River Oak',
    srocCategory: null,
    dateCreated: '2019-09-26T08:12:08.346Z',
    dateUpdated: '2019-09-26T08:12:08.346Z',
    eiucSource: 'other',
    chargeAgreements: [{
      chargeAgreementId: 'charge-agreement-1',
      id: 'charge-element-1',
      agreementCode: 'S127',
      startDate: '2017-10-11T23:00:00.000Z',
      endDate: null,
      signedDate: null,
      fileReference: null,
      description: null,
      dateCreated: '2019-09-26T08:12:17.107Z',
      dateUpdated: '2019-09-26T08:12:17.107Z',
      agreementDescription: 'Section 127 (Two Part Tariff)'
    }]
  },
  {
    id: 'charge-element-2',
    abstractionPeriod: {
      startDay: 1,
      startMonth: 4,
      endDay: 31,
      endMonth: 10
    },
    startDate: '2017-04-01',
    endDate: '2018-03-31',
    totalDays: 365,
    billableDays: 204,
    authorisedAnnualQuantity: '22.7',
    season: 'summer',
    source: 'unsupported',
    loss: 'high',
    purposeUse: {
      type: 'use',
      code: '400',
      name: 'Spray Irrigation - Direct',
      isTwoPartTariff: true
    },
    factorsOverridden: false,
    billableAnnualQuantity: '2.7',
    description: 'Reservoir',
    srocCategory: null,
    dateCreated: '2019-09-26T08:12:08.346Z',
    dateUpdated: '2019-09-26T08:12:08.346Z',
    eiucSource: 'other',
    chargeAgreements: [{
      chargeAgreementId: 'charge-agreement-2',
      id: 'charge-element-2',
      agreementCode: 'S127',
      startDate: '2017-10-11T23:00:00.000Z',
      endDate: null,
      signedDate: null,
      fileReference: null,
      description: null,
      dateCreated: '2019-09-26T08:12:17.107Z',
      dateUpdated: '2019-09-26T08:12:17.107Z',
      agreementDescription: 'Section 127 (Two Part Tariff)'
    }]
  },
  {
    id: 'charge-element-3',
    abstractionPeriod: {
      startDay: 1,
      startMonth: 11,
      endDay: 31,
      endMonth: 3
    },
    authorisedAnnualQuantity: '20',
    season: 'winter',
    source: 'unsupported',
    loss: 'very low',
    purposeUse: {
      type: 'use',
      code: '650',
      name: 'Transfer Between Sources (Post Water Act 2003)',
      isTwoPartTariff: false
    },
    factorsOverridden: false,
    billableAnnualQuantity: null,
    description: 'River Oak',
    srocCategory: null,
    dateCreated: '2019-09-26T08:12:08.346Z',
    dateUpdated: '2019-09-26T08:12:08.346Z',
    eiucSource: 'other',
    chargeAgreements: []
  },
  {
    id: 'charge-element-4',
    abstractionPeriod: {
      startDay: 1,
      startMonth: 4,
      endDay: 31,
      endMonth: 10
    },
    startDate: '2017-04-01',
    endDate: '2018-03-31',
    totalDays: 365,
    billableDays: 204,
    authorisedAnnualQuantity: '22.7',
    season: 'winter',
    source: 'unsupported',
    loss: 'high',
    purposeUse: {
      type: 'use',
      code: '420',
      name: 'Spray Irrigation - Direct',
      isTwoPartTariff: true
    },
    factorsOverridden: true,
    billableAnnualQuantity: '20',
    description: 'Reservoir',
    srocCategory: null,
    dateCreated: '2019-09-26T08:12:08.346Z',
    dateUpdated: '2019-09-26T08:12:08.346Z',
    eiucSource: 'other',
    chargeAgreements: [{
      chargeAgreementId: 'charge-agreement-3',
      id: 'charge-element-4',
      agreementCode: 'S127',
      startDate: '2017-10-11T23:00:00.000Z',
      endDate: null,
      signedDate: null,
      fileReference: null,
      description: null,
      dateCreated: '2019-09-26T08:12:17.107Z',
      dateUpdated: '2019-09-26T08:12:17.107Z',
      agreementDescription: 'Section 127 (Two Part Tariff)'
    }]
  }];

const returns = [{
  returnId: 'return-1',
  licenceNumber: 'licence-ref',
  receivedDate: '2018-05-23',
  startDate: '2017-10-12',
  endDate: '2018-03-31',
  dueDate: '2018-04-28',
  frequency: 'week',
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
    startDate: '2017-10-08',
    endDate: '2017-10-13',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-10-15',
    endDate: '2017-10-20',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-10-22',
    endDate: '2017-10-27',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-10-29',
    endDate: '2017-11-03',
    quantity: 0,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-11-05',
    endDate: '2017-11-10',
    quantity: 0,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-11-12',
    endDate: '2017-11-17',
    quantity: 0,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-11-19',
    endDate: '2017-11-24',
    quantity: 0,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-11-26',
    endDate: '2017-12-01',
    quantity: 0,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-12-03',
    endDate: '2017-12-08',
    quantity: 0,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-12-10',
    endDate: '2017-12-15',
    quantity: 0,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-12-17',
    endDate: '2017-12-22',
    quantity: 0,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-12-24',
    endDate: '2017-12-29',
    quantity: 0,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-12-31',
    endDate: '2018-01-05',
    quantity: 0,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2018-01-07',
    endDate: '2018-01-12',
    quantity: 0,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2018-01-14',
    endDate: '2018-01-19',
    quantity: 10243,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2018-01-21',
    endDate: '2018-01-26',
    quantity: 7836,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2018-01-28',
    endDate: '2018-02-02',
    quantity: 8635,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2018-02-04',
    endDate: '2018-02-09',
    quantity: 8960,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2018-02-11',
    endDate: '2018-02-16',
    quantity: 8790,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2018-02-18',
    endDate: '2018-02-23',
    quantity: 7833,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2018-02-25',
    endDate: '2018-03-02',
    quantity: 7970,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2018-03-04',
    endDate: '2018-03-09',
    quantity: 1633,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2018-03-11',
    endDate: '2018-03-16',
    quantity: 2460,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2018-03-18',
    endDate: '2018-03-23',
    quantity: 0,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2018-03-25',
    endDate: '2018-03-30',
    quantity: 2570,
    timePeriod: 'week',
    readingType: 'measured'
  }
  ],
  metadata: {
    nald: {
      periodEndDay: '31',
      periodEndMonth: '3',
      periodStartDay: '1',
      periodStartMonth: '11'
    },
    points: [{
      name: 'RIVER OAK',
      ngr1: 'XX 123 456',
      ngr2: null,
      ngr3: null,
      ngr4: null
    }],
    isFinal: false,
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
    }],
    isCurrent: true,
    description: 'RIVER OAK',
    isTwoPartTariff: true
  },
  versions: [{
    versionNumber: 1,
    isCurrent: true
  }],
  isUnderQuery: false
},
{
  returnId: 'return-2',
  licenceNumber: 'licence-ref',
  receivedDate: null,
  startDate: '2017-04-01',
  endDate: '2017-10-11',
  dueDate: '2018-04-28',
  frequency: 'week',
  isNil: true,
  status: 'due',
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
    startDate: '2017-04-02',
    endDate: '2017-04-02',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-04-09',
    endDate: '2017-04-09',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-04-16',
    endDate: '2017-04-16',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-04-23',
    endDate: '2017-04-23',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-04-30',
    endDate: '2017-04-30',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-05-07',
    endDate: '2017-05-07',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-05-14',
    endDate: '2017-05-14',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-05-21',
    endDate: '2017-05-21',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-05-28',
    endDate: '2017-05-28',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-06-04',
    endDate: '2017-06-04',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-06-11',
    endDate: '2017-06-11',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-06-18',
    endDate: '2017-06-18',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-06-25',
    endDate: '2017-06-25',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-07-02',
    endDate: '2017-07-02',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-07-09',
    endDate: '2017-07-09',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-07-16',
    endDate: '2017-07-16',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-07-23',
    endDate: '2017-07-23',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-07-30',
    endDate: '2017-07-30',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-08-06',
    endDate: '2017-08-06',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-08-13',
    endDate: '2017-08-13',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-08-20',
    endDate: '2017-08-20',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-08-27',
    endDate: '2017-08-27',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-09-03',
    endDate: '2017-09-03',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-09-10',
    endDate: '2017-09-10',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-09-17',
    endDate: '2017-09-17',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-09-24',
    endDate: '2017-09-24',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-10-01',
    endDate: '2017-10-01',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  },
  {
    startDate: '2017-10-08',
    endDate: '2017-10-08',
    quantity: null,
    timePeriod: 'week',
    readingType: 'measured'
  }
  ],
  metadata: {
    nald: {
      periodEndDay: '31',
      periodEndMonth: '3',
      periodStartDay: '1',
      periodStartMonth: '11'
    },
    points: [{
      name: 'RIVER OAK',
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
      alias: 'SPRAY IRRIGATION - STORAGE/DIRECT',
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
    }],
    isCurrent: true,
    description: 'RIVER OAK',
    isTwoPartTariff: true
  },
  versions: [{
    versionNumber: 1,
    isCurrent: true
  }],
  isUnderQuery: false
}];

module.exports = {
  chargeElements,
  returns
};
