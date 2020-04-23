const chargeElements = [{
  id: 'charge-element-1',
  abstractionPeriod: {
    startDay: 1,
    startMonth: 1,
    endDay: 31,
    endMonth: 12
  },
  startDate: '2017-04-01',
  endDate: '2018-03-31',
  totalDays: 365,
  billableDays: 365,
  authorisedAnnualQuantity: '25',
  season: 'summer',
  source: 'unsupported',
  loss: 'high',
  purposeUse: {
    type: 'use',
    code: '400',
    name: 'Spray Irrigation - Direct'
  },
  factorsOverridden: false,
  billableAnnualQuantity: '25',
  description: 'BORE AT FARM',
  srocCategory: null,
  dateCreated: '2019-09-26T08:12:08.346Z',
  dateUpdated: '2019-09-26T08:12:08.346Z',
  eiucSource: 'other',
  chargeAgreements: []
}];

const returns = [{
  returnId: 'return-1',
  licenceNumber: 'licence-ref',
  receivedDate: '2018-04-16',
  startDate: '2017-04-01',
  endDate: '2018-03-28',
  dueDate: '2018-04-25',
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
    quantity: 0,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-05-01',
    endDate: '2017-05-31',
    quantity: 1078,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-06-01',
    endDate: '2017-06-30',
    quantity: 806,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-07-01',
    endDate: '2017-07-31',
    quantity: 739,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-08-01',
    endDate: '2017-08-31',
    quantity: 0,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2017-09-01',
    endDate: '2017-09-30',
    quantity: 1221,
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
  },
  {
    startDate: '2017-12-01',
    endDate: '2017-12-31',
    quantity: 0,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2018-01-01',
    endDate: '2018-01-31',
    quantity: 0,
    timePeriod: 'month',
    readingType: 'measured'
  },
  {
    startDate: '2018-02-01',
    endDate: '2018-02-28',
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
      name: 'BORE AT FARM',
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
      alias: 'SPRAY IRR DIRECT &/OR GENERAL AGRICULTURE',
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
    description: 'BORE AT FARM',
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
