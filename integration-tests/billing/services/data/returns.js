
exports.r1 = {
  returnId:	'v1:1:L1:12345678:2015-11-01:2016-10-31',
  regime:	'water',
  licenceType:	'abstraction', 
  startDate: '2018-11-01',
  endDate: '2019-10-31',
  dueDate:	'2019-11-28',
  returnsFrequency:	'month',
  status:	'completed',
  source:	'NALD',
  metadata:	{
    nald: {
    areaCode: 'AREA',
    formatId: 12345678,
    regionCode: 1,
    periodEndDay: '31',
    periodEndMonth: '10',
    periodStartDay: '1',
    periodStartMonth: '4'
  },
  points: [
    {
      name: 'BORE, ABBEY FARM, BACTON',
      ngr1: 'TG 347 328',
      ngr2: null,
      ngr3: null,
      ngr4: null
    }
  ],
  isFinal: false,
  version: 1,
  isSummer: true,
  isUpload: false, 
  purposes: [
    {
      alias: 'SPRAY IRRIGATION DIRECT',
      primary: {
        code: 'A', 
        description: 'Agriculture'
      },
      secondary: {
        code: 'AGR',
        description: 'General Agriculture'
      },
      tertiary: {
        code: '400',
        description: 'Spray Irrigation - Direct'
      }
    }
  ],
  isCurrent: true,
  description: 'BORE, ABBEY FARM, BACTON',
  isTwoPartTariff: true
  },
  receivedDate:	'2019-11-29',
  returnRequirement:	'12345678',  
  underQuery: false,
  isTest: true
};