const chargeElements = [{
  id: 'charge-element-1',
  abstractionPeriod: {
    startDay: 1,
    startMonth: 3,
    endDay: 31,
    endMonth: 10
  },
  startDate: '2017-04-01',
  endDate: '2018-03-31',
  totalDays: 245,
  billableDays: 245,
  authorisedAnnualQuantity: '19.32',
  season: 'summer',
  source: 'unsupported',
  loss: 'high',
  purposeUse: {
    type: 'use',
    code: '400',
    name: 'Spray Irrigation - Direct'
  },
  factorsOverridden: false,
  billableAnnualQuantity: null,
  description: 'GOLF CLUB BOREHOLE',
  srocCategory: null,
  dateCreated: '2019-09-26T08:12:08.346Z',
  dateUpdated: '2019-09-26T08:12:08.346Z',
  eiucSource: 'other',
  chargeAgreements: [{
    chargeAgreementId: 'charge-agreement-1',
    id: 'charge-element-1',
    agreementCode: 'S127',
    startDate: '2018-02-27T00:00:00.000Z',
    endDate: null,
    signedDate: '2018-03-07T00:00:00.000Z',
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
  receivedDate: '2018-04-13',
  startDate: '2018-02-27',
  endDate: '2018-03-31',
  dueDate: '2018-04-28',
  frequency: 'month',
  isNil: true,
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
    startDate: '2018-02-01',
    endDate: '2018-02-28',
    quantity: null,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2018-03-01',
    endDate: '2018-03-31',
    quantity: 0,
    timePeriod: 'month',
    readingType: 'measured'
  }
  ],
  metadata: {
    nald: {
      periodEndDay: '31',
      periodEndMonth: '10',
      periodStartDay: '1',
      periodStartMonth: '3'
    },
    points: [{
      name: 'BOREHOLE AT GOLF COURSE',
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
        code: '400',
        description: 'Spray Irrigation - Direct'
      },
      secondary: {
        code: 'AGR',
        description: 'General Agriculture'
      }
    }],
    isCurrent: true,
    description: 'BOREHOLE AT GOLF CLUB',
    isTwoPartTariff: true
  },
  versions: [{
    versionNumber: 1,
    isCurrent: true
  }],
  isUnderQuery: false
}, {
  returnId: 'return-2',
  licenceNumber: 'licence-ref',
  receivedDate: '2018-04-13',
  startDate: '2017-04-01',
  endDate: '2018-02-26',
  dueDate: '2018-03-26',
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
    quantity: 1559,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-05-01',
    endDate: '2017-05-31',
    quantity: 4439,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-06-01',
    endDate: '2017-06-30',
    quantity: 3524,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-07-01',
    endDate: '2017-07-31',
    quantity: 1560,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-08-01',
    endDate: '2017-08-31',
    quantity: 632,
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
    quantity: null,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-12-01',
    endDate: '2017-12-31',
    quantity: null,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2018-01-01',
    endDate: '2018-01-31',
    quantity: null,
    timePeriod: 'month',
    readingType: 'measured'
  }
  ],
  metadata: {
    nald: {
      periodEndDay: '31',
      periodEndMonth: '10',
      periodStartDay: '1',
      periodStartMonth: '3'
    },
    points: [{
      name: 'BOREHOLE AT GOLF COURSE',
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
        code: '400',
        description: 'Spray Irrigation - Direct'
      },
      secondary: {
        code: 'AGR',
        description: 'General Agriculture'
      }
    }],
    isCurrent: false,
    description: 'BOREHOLE AT GOLF CLUB',
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
