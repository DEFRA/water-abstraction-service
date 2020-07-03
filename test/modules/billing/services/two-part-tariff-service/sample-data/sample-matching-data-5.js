const chargeElements = [{
  id: 'charge-element-1',
  abstractionPeriod: {
    startDay: 1,
    startMonth: 11,
    endDay: 31,
    endMonth: 3
  },
  startDate: '2017-11-01',
  endDate: '2018-03-31',
  totalDays: 151,
  billableDays: 151,
  authorisedAnnualQuantity: '72',
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
  billableAnnualQuantity: '52',
  description: 'CROOKED DRAIN',
  srocCategory: null,
  dateCreated: '2019-09-26T08:12:08.346Z',
  dateUpdated: '2019-09-26T08:12:08.346Z',
  eiucSource: 'other',
  chargeAgreements: [{
    chargeAgreementId: 'charge-agreement-1',
    id: 'charge-element-1',
    agreementCode: 'S127',
    startDate: '2005-09-14T23:00:00.000Z',
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
    endDay: 30,
    endMonth: 4
  },
  startDate: '2017-04-01',
  endDate: '2017-04-30',
  totalDays: 30,
  billableDays: 30,
  authorisedAnnualQuantity: '20',
  season: 'summer',
  source: 'unsupported',
  loss: 'high',
  purposeUse: {
    type: 'use',
    code: '420',
    name: 'Spray Irrigation - Storage',
    isTwoPartTariff: true
  },
  factorsOverridden: false,
  billableAnnualQuantity: '10',
  description: 'CROOKED DRAIN',
  srocCategory: null,
  dateCreated: '2019-09-26T08:12:08.346Z',
  dateUpdated: '2019-09-26T08:12:08.346Z',
  eiucSource: 'other',
  chargeAgreements: [{
    chargeAgreementId: 'charge-agreement-2',
    id: 'charge-element-2',
    agreementCode: 'S127',
    startDate: '2005-09-14T23:00:00.000Z',
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
    startMonth: 10,
    endDay: 31,
    endMonth: 10
  },
  startDate: '2017-10-01',
  endDate: '2017-10-31',
  totalDays: 31,
  billableDays: 31,
  authorisedAnnualQuantity: '20',
  season: 'summer',
  source: 'unsupported',
  loss: 'high',
  purposeUse: {
    type: 'use',
    code: '420',
    name: 'Spray Irrigation - Storage',
    isTwoPartTariff: true
  },
  factorsOverridden: false,
  billableAnnualQuantity: '10',
  description: 'CROOKED DRAIN',
  srocCategory: null,
  dateCreated: '2019-09-26T08:12:08.346Z',
  dateUpdated: '2019-09-26T08:12:08.346Z',
  eiucSource: 'other',
  chargeAgreements: [{
    chargeAgreementId: 'charge-agreement-3',
    id: 'charge-element-3',
    agreementCode: 'S127',
    startDate: '2005-09-14T23:00:00.000Z',
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
  receivedDate: '2018-05-03',
  startDate: '2017-04-01',
  endDate: '2018-03-31',
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
    quantity: 3370,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-05-01',
    endDate: '2017-05-31',
    quantity: 8110,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-06-01',
    endDate: '2017-06-30',
    quantity: null,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-07-01',
    endDate: '2017-07-31',
    quantity: null,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-08-01',
    endDate: '2017-08-31',
    quantity: null,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-09-01',
    endDate: '2017-09-30',
    quantity: null,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-10-01',
    endDate: '2017-10-31',
    quantity: 6350,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-11-01',
    endDate: '2017-11-30',
    quantity: 9950,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-12-01',
    endDate: '2017-12-31',
    quantity: 7510,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2018-01-01',
    endDate: '2018-01-31',
    quantity: 7170,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2018-02-01',
    endDate: '2018-02-28',
    quantity: 0,
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
      periodEndMonth: '3',
      periodStartDay: '1',
      periodStartMonth: '11'
    },
    points: [{
      name: 'CROOKED DRAIN',
      ngr1: 'XX 123 456',
      ngr2: 'XX 123 456',
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
    description: 'CROOKED DRAIN',
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
