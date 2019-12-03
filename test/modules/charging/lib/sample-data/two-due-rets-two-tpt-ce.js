const chargeVersion = {
  'chargeVersionId': 'charge-version-1',
  'licenceRef': 'licence-ref',
  'scheme': 'alcs',
  'versionNumber': 104,
  'startDate': '2016-07-28T23:00:00.000Z',
  'status': 'superseded',
  'apportionment': false,
  'error': false,
  'endDate': '2018-04-07T23:00:00.000Z',
  'billedUptoDate': '2018-04-07T23:00:00.000Z',
  'dateCreated': '2019-09-26T08:12:02.492Z',
  'dateUpdated': '2019-09-26T08:12:02.492Z',
  'source': 'nald',
  'chargeElements': [{
    'chargeElementId': 'charge-element-1',
    'chargeVersionId': 'charge-version-1',
    'abstractionPeriodStartDay': 1,
    'abstractionPeriodStartMonth': 3,
    'abstractionPeriodEndDay': 30,
    'abstractionPeriodEndMonth': 9,
    'authorisedAnnualQuantity': '91.4',
    'season': 'summer',
    'seasonDerived': 'summer',
    'source': 'unsupported',
    'loss': 'high',
    'purposePrimary': 'A',
    'purposeSecondary': 'AGR',
    'purposeTertiary': '420',
    'factorsOverridden': false,
    'billableAnnualQuantity': '91.4',
    'timeLimitedStartDate': '2008-03-31T23:00:00.000Z',
    'timeLimitedEndDate': '2018-03-30T23:00:00.000Z',
    'description': 'T/L B/H ABSTRACTION',
    'srocCategory': null,
    'dateCreated': '2019-09-26T08:12:08.346Z',
    'dateUpdated': '2019-09-26T08:12:08.346Z',
    'purposePrimaryDescription': 'Agriculture',
    'purposeSecondaryDescription': 'General Agriculture',
    'purposeTertiaryDescription': 'Spray Irrigation - Storage',
    'eiucSource': 'other',
    'chargeAgreements': [{
      'chargeAgreementId': 'charge-agreement-1',
      'chargeElementId': 'charge-element-1',
      'agreementCode': 'S127',
      'startDate': '2008-03-31T23:00:00.000Z',
      'endDate': null,
      'signedDate': null,
      'fileReference': null,
      'description': null,
      'dateCreated': '2019-09-26T08:12:17.107Z',
      'dateUpdated': '2019-09-26T08:12:17.107Z',
      'agreementDescription': 'Section 127 (Two Part Tariff)'
    }]
  },
  {
    'chargeElementId': 'charge-element-2',
    'chargeVersionId': 'charge-version-1',
    'abstractionPeriodStartDay': 1,
    'abstractionPeriodStartMonth': 3,
    'abstractionPeriodEndDay': 30,
    'abstractionPeriodEndMonth': 9,
    'authorisedAnnualQuantity': '22.7',
    'season': 'summer',
    'seasonDerived': 'summer',
    'source': 'unsupported',
    'loss': 'high',
    'purposePrimary': 'A',
    'purposeSecondary': 'AGR',
    'purposeTertiary': '420',
    'factorsOverridden': false,
    'billableAnnualQuantity': '22.7',
    'timeLimitedStartDate': null,
    'timeLimitedEndDate': null,
    'description': '2 BORES-NON TL ABSTR',
    'srocCategory': null,
    'dateCreated': '2019-09-26T08:12:08.346Z',
    'dateUpdated': '2019-09-26T08:12:08.346Z',
    'purposePrimaryDescription': 'Agriculture',
    'purposeSecondaryDescription': 'General Agriculture',
    'purposeTertiaryDescription': 'Spray Irrigation - Storage',
    'eiucSource': 'other',
    'chargeAgreements': [{
      'chargeAgreementId': 'charge-agreement-2',
      'chargeElementId': 'charge-element-2',
      'agreementCode': 'S127',
      'startDate': '2004-11-19T00:00:00.000Z',
      'endDate': null,
      'signedDate': null,
      'fileReference': null,
      'description': null,
      'dateCreated': '2019-09-26T08:12:17.107Z',
      'dateUpdated': '2019-09-26T08:12:17.107Z',
      'agreementDescription': 'Section 127 (Two Part Tariff)'
    }]
  },
  {
    'chargeElementId': 'charge-element-3',
    'chargeVersionId': 'charge-version-1',
    'abstractionPeriodStartDay': 1,
    'abstractionPeriodStartMonth': 1,
    'abstractionPeriodEndDay': 31,
    'abstractionPeriodEndMonth': 12,
    'authorisedAnnualQuantity': '4.5',
    'season': 'all year',
    'seasonDerived': 'all year',
    'source': 'unsupported',
    'loss': 'medium',
    'purposePrimary': 'A',
    'purposeSecondary': 'AGR',
    'purposeTertiary': '140',
    'factorsOverridden': false,
    'billableAnnualQuantity': '4.5',
    'timeLimitedStartDate': null,
    'timeLimitedEndDate': null,
    'description': 'BOREHOLES FOR GENERAL AGRICULTURE',
    'srocCategory': null,
    'dateCreated': '2019-09-26T08:12:08.346Z',
    'dateUpdated': '2019-09-26T08:12:08.346Z',
    'purposePrimaryDescription': 'Agriculture',
    'purposeSecondaryDescription': 'General Agriculture',
    'purposeTertiaryDescription': 'General Farming & Domestic',
    'eiucSource': 'other',
    'chargeAgreements': []
  }
  ]
};

const returns = [{
  'returnId': 'return-1',
  'licenceNumber': 'licence-ref',
  'receivedDate': null,
  'startDate': '2017-04-01',
  'endDate': '2018-03-31',
  'dueDate': '2018-04-28',
  'frequency': 'month',
  'isNil': true,
  'status': 'due',
  'versionNumber': 1,
  'isCurrent': true,
  'reading': {
    'type': null,
    'method': null,
    'units': 'm³',
    'totalFlag': null,
    'total': null,
    'totalCustomDates': false,
    'totalCustomDateStart': null,
    'totalCustomDateEnd': null
  },
  'meters': [],
  'requiredLines': null,
  'lines': [{
    'startDate': '2017-04-01',
    'endDate': '2017-04-30',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2017-05-01',
    'endDate': '2017-05-31',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2017-06-01',
    'endDate': '2017-06-30',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2017-07-01',
    'endDate': '2017-07-31',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2017-08-01',
    'endDate': '2017-08-31',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2017-09-01',
    'endDate': '2017-09-30',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2017-10-01',
    'endDate': '2017-10-31',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2017-11-01',
    'endDate': '2017-11-30',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2017-12-01',
    'endDate': '2017-12-31',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2018-01-01',
    'endDate': '2018-01-31',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2018-02-01',
    'endDate': '2018-02-28',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2018-03-01',
    'endDate': '2018-03-31',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  }
  ],
  'metadata': {
    'nald': {
      'periodEndDay': '30',
      'periodEndMonth': '9',
      'periodStartDay': '1',
      'periodStartMonth': '3'
    },
    'points': [{
      'name': 'BORE NO 1',
      'ngr1': 'XX 123 456',
      'ngr2': null,
      'ngr3': null,
      'ngr4': null
    }],
    'isFinal': true,
    'version': 1,
    'isSummer': false,
    'isUpload': false,
    'purposes': [{
      'alias': 'SPRAY IRRIGATION STORAGE-MAR TO SEPT',
      'primary': {
        'code': 'A',
        'description': 'Agriculture'
      },
      'tertiary': {
        'code': '420',
        'description': 'Spray Irrigation - Storage'
      },
      'secondary': {
        'code': 'AGR',
        'description': 'General Agriculture'
      }
    }],
    'isCurrent': true,
    'description': 'BORE 1',
    'isTwoPartTariff': true
  },
  'versions': [{
    'versionNumber': 1,
    'isCurrent': true
  }],
  'isUnderQuery': false
},
{
  'returnId': 'return-2',
  'licenceNumber': 'licence-ref',
  'receivedDate': null,
  'startDate': '2017-04-01',
  'endDate': '2018-03-31',
  'dueDate': '2018-04-28',
  'frequency': 'month',
  'isNil': true,
  'status': 'due',
  'versionNumber': 1,
  'isCurrent': true,
  'reading': {
    'type': null,
    'method': null,
    'units': 'm³',
    'totalFlag': null,
    'total': null,
    'totalCustomDates': false,
    'totalCustomDateStart': null,
    'totalCustomDateEnd': null
  },
  'meters': [],
  'requiredLines': null,
  'lines': [{
    'startDate': '2017-04-01',
    'endDate': '2017-04-30',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2017-05-01',
    'endDate': '2017-05-31',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2017-06-01',
    'endDate': '2017-06-30',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2017-07-01',
    'endDate': '2017-07-31',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2017-08-01',
    'endDate': '2017-08-31',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2017-09-01',
    'endDate': '2017-09-30',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2017-10-01',
    'endDate': '2017-10-31',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2017-11-01',
    'endDate': '2017-11-30',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2017-12-01',
    'endDate': '2017-12-31',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2018-01-01',
    'endDate': '2018-01-31',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2018-02-01',
    'endDate': '2018-02-28',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  },
  {
    'startDate': '2018-03-01',
    'endDate': '2018-03-31',
    'quantity': null,
    'timePeriod': 'month',
    'readingType': 'measured'
  }
  ],
  'metadata': {
    'nald': {
      'periodEndDay': '30',
      'periodEndMonth': '9',
      'periodStartDay': '1',
      'periodStartMonth': '3'
    },
    'points': [{
      'name': 'BORE NO 2',
      'ngr1': 'XX 123 456',
      'ngr2': null,
      'ngr3': null,
      'ngr4': null
    }],
    'isFinal': true,
    'version': 1,
    'isSummer': false,
    'isUpload': false,
    'purposes': [{
      'alias': 'SPRAY IRRIGATION STORAGE-MAR TO SEPT',
      'primary': {
        'code': 'A',
        'description': 'Agriculture'
      },
      'tertiary': {
        'code': '420',
        'description': 'Spray Irrigation - Storage'
      },
      'secondary': {
        'code': 'AGR',
        'description': 'General Agriculture'
      }
    }],
    'isCurrent': true,
    'description': 'BORE 2',
    'isTwoPartTariff': true
  },
  'versions': [{
    'versionNumber': 1,
    'isCurrent': true
  }],
  'isUnderQuery': false
}];

module.exports = {
  chargeVersion,
  returns
};
