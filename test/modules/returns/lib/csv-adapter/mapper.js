const { expect } = require('@hapi/code');
const { find } = require('lodash');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const csvMapper = require('../../../../../src/modules/returns/lib/csv-adapter/mapper');

const headers = [
  'Licence number',
  'Return reference',
  'Nil return Y/N',
  'Did you use a meter Y/N',
  'Meter make',
  'Meter serial number',
  'Week ending 6 April 2019',
  'Week ending 13 April 2019',
  'Week ending 20 April 2019',
  'Unique return reference'
];

const column = [
  '01/123',
  '01234',
  'N',
  'Y',
  'Superpump',
  '1234',
  '45',
  '',
  'do not edit',
  'v1:1:01/123:01234:2019-04-01:2020-03-31'
];

const nilReturn = [
  '01/123',
  '01234',
  'Y',
  '',
  '',
  '',
  '',
  '',
  '',
  'v1:1:01/123:01234:2019-04-01:2020-03-31'
];

const emptyReturn = [
  '01/123',
  '01234',
  ' ',
  '',
  '',
  '',
  '',
  'Do not edit',
  'Do not edit',
  'v1:1:01/123:01234:2019-04-01:2020-03-31'
];

const csv = `Licence number,01/23,02/34
Return reference,1234,5678
Nil return Y/N,N,
Did you use a meter Y/N,N,
Meter make,Superpump,
Meter serial number,789,
April 2018,Do not edit,
May 2018,Do not edit,
June 2018,Do not edit,
July 2018,Do not edit,
August 2018,Do not edit,
September 2018,Do not edit,
October 2018,10,
November 2018,25,
December 2018,4,
January 2019,6,
February 2019,,
March 2019,2,
Unique return reference,v1:8:01/123:1234:2018-10-30:2019-03-31,v1:8:02/34:5678:2018-04-01:2019-03-31`;

const user = {
  user_name: 'mail@example.com',
  role: {
    scopes: ['internal']
  },
  external_id: 'entity_id'
};

experiment('returns CSV to JSON mapper', () => {
  experiment('normalize', () => {
    test('should trim and lowercase values', async () => {
      const result = csvMapper._normalize('  Some Data ');
      expect(result).to.equal('some data');
    });
  });

  experiment('parseDateFrequency', () => {
    experiment('when there are 12 data lines', () => {
      test('the data is considered to be monthly', async () => {
        const result = csvMapper._parseDateFrequency('31 January 2019', 12);
        expect(result).to.equal('month');
      });
    });

    experiment('when the data starts with "week ending"', () => {
      test('the data is considered to be weekly', async () => {
        const date = 'week ending 31 January 2019';
        const result = csvMapper._parseDateFrequency(date, 12);
        expect(result).to.equal('week');
      });
    });

    experiment('for more than 12 lines and a date not starting with "week ending"', () => {
      test('the data is considered to be daily', async () => {
        const date = '31 January 2019';
        const result = csvMapper._parseDateFrequency(date, 120);
        expect(result).to.equal('day');
      });
    });
  });

  experiment('createDay', async () => {
    test('creates a day return line skeleton from preferred data format', async () => {
      const result = csvMapper._createDay('7 May 2019');
      expect(result).to.equal({
        startDate: '2019-05-07',
        endDate: '2019-05-07',
        timePeriod: 'day'
      });
    });

    const otherFormats = [
      '7 Aug 2019',
      '07 Aug 2019',
      '7-Aug-2019',
      '07-Aug-2019',
      '7/Aug/2019',
      '07/Aug/2019',

      '07 Aug 19',
      '07-Aug-19',
      '07/Aug/19',
      '7 Aug 19',
      '7-Aug-19',
      '7/Aug/19',

      '7 August 2019',
      '07 August 2019',
      '7-August-2019',
      '07-August-2019',
      '7/August/2019',
      '07/August/2019',
      '07-08-2019',
      '07/08/2019'
    ];

    otherFormats.forEach(format => {
      test(`${format} creates a day return line skeleton for other date formats`, async () => {
        const result = csvMapper._createDay(format);
        expect(result).to.equal({
          startDate: '2019-08-07',
          endDate: '2019-08-07',
          timePeriod: 'day'
        });
      });
    });

    test('creates a day return line skeleton from DD  data format', async () => {
      const result = csvMapper._createDay('7 May 2019');
      expect(result).to.equal({
        startDate: '2019-05-07',
        endDate: '2019-05-07',
        timePeriod: 'day'
      });
    });
  });

  experiment('createWeek', async () => {
    test('create a weekly return line skeleton from the preferred date format', async () => {
      const result = csvMapper._createWeek('11 May 2019');
      expect(result).to.equal({
        startDate: '2019-05-05',
        endDate: '2019-05-11',
        timePeriod: 'week'
      });
    });

    const otherFormats = [
      '3 Aug 2019',
      '03 Aug 2019',
      '3-Aug-2019',
      '03-Aug-2019',
      '3/Aug/2019',
      '03/Aug/2019',

      '03 Aug 19',
      '03-Aug-19',
      '03/Aug/19',
      '3 Aug 19',
      '3-Aug-19',
      '3/Aug/19',

      '3 August 2019',
      '03 August 2019',
      '3-August-2019',
      '03-August-2019',
      '3/August/2019',
      '03/August/2019',
      '03-08-2019',
      '03/08/2019'
    ];

    otherFormats.forEach(format => {
      test(`${format} creates a day return line skeleton for other date formats`, async () => {
        const result = csvMapper._createWeek(format);
        expect(result).to.equal({
          startDate: '2019-07-28',
          endDate: '2019-08-03',
          timePeriod: 'week'
        });
      });
    });
  });

  experiment('createMonth', async () => {
    test('creates a month return line skeleton for preferred format', async () => {
      const result = csvMapper._createMonth('May 2019');
      expect(result).to.equal({
        startDate: '2019-05-01',
        endDate: '2019-05-31',
        timePeriod: 'month'
      });
    });

    const otherFormats = [
      '1 Aug 2019',
      '01 Aug 2019',
      '1-Aug-2019',
      '01-Aug-2019',
      '1/Aug/2019',
      '01/Aug/2019',

      '01 Aug 19',
      '01-Aug-19',
      '01/Aug/19',
      '1 Aug 19',
      '1-Aug-19',
      '1/Aug/19',

      '1 August 2019',
      '01 August 2019',
      '1-August-2019',
      '01-August-2019',
      '1/August/2019',
      '01/August/2019',
      '01-08-2019',
      '01/08/2019'
    ];

    otherFormats.forEach(format => {
      test(`${format} creates a day return line skeleton for other date formats`, async () => {
        const result = csvMapper._createMonth(format);
        expect(result).to.equal({
          startDate: '2019-08-01',
          endDate: '2019-08-31',
          timePeriod: 'month'
        });
      });
    });
  });

  experiment('createReturnLine', async () => {
    test('detects and returns a daily line', async () => {
      const result = csvMapper._createReturnLine('7 May 2019', 200);
      expect(result).to.equal({
        startDate: '2019-05-07',
        endDate: '2019-05-07',
        timePeriod: 'day'
      });
    });

    test('detects and returns a weekly line', async () => {
      const result = csvMapper._createReturnLine('Week ending 11 May 2019', 52);
      expect(result).to.equal({
        startDate: '2019-05-05',
        endDate: '2019-05-11',
        timePeriod: 'week'
      });
    });

    test('detects and returns a monthly line', async () => {
      const result = csvMapper._createReturnLine('May 2019', 12);
      expect(result).to.equal({
        startDate: '2019-05-01',
        endDate: '2019-05-31',
        timePeriod: 'month'
      });
    });
  });

  experiment('mapQuantity', () => {
    test('maps an empty string to null', async () => {
      const result = csvMapper._mapQuantity('  ');
      expect(result).to.equal(null);
    });

    test('maps a number', async () => {
      const result = csvMapper._mapQuantity('10.4343');
      expect(result).to.equal(10.4343);
    });

    test('accepts commas as a separator', async () => {
      const result = csvMapper._mapQuantity('10,434');
      expect(result).to.equal(10434);
    });

    test('accepts multiple commas as a separator', async () => {
      const result = csvMapper._mapQuantity('10,434,789.123');
      expect(result).to.equal(10434789.123);
    });
  });

  experiment('mapLines', async () => {
    let result;

    beforeEach(async () => {
      result = csvMapper._mapLines(headers, column, 'measured');
    });

    test('maps numbers into a return line with numeric quantity', async () => {
      const line = find(result, { endDate: '2019-04-06' });
      expect(line).to.equal({
        unit: 'm³',
        userUnit: 'm³',
        startDate: '2019-03-31',
        endDate: '2019-04-06',
        timePeriod: 'week',
        quantity: 45,
        readingType: 'measured'
      });
    });

    test('maps empty cell to a return line with a null quantity', async () => {
      const line = find(result, { endDate: '2019-04-13' });
      expect(line).to.equal({
        unit: 'm³',
        userUnit: 'm³',
        startDate: '2019-04-07',
        endDate: '2019-04-13',
        timePeriod: 'week',
        quantity: null,
        readingType: 'measured'
      });
    });

    test('excludes cells containing "Do not edit" from the mapped lines', async () => {
      const line = find(result, { endDate: '2019-04-20' });
      expect(line).to.be.undefined();
    });
  });

  experiment('mapReading', () => {
    test('maps reading type to "measured" when cell marked as "Y"', async () => {
      const column = ['', '', '', 'Y'];
      const result = csvMapper._mapReading(column);
      expect(result).to.equal({
        type: 'measured',
        method: 'abstractionVolumes',
        units: 'm³',
        totalFlag: false
      });
    });

    test('maps reading type to "estimated" when cell marked as "N"', async () => {
      const column = ['', '', '', 'N'];
      const result = csvMapper._mapReading(column);
      expect(result).to.equal({
        type: 'estimated',
        method: 'abstractionVolumes',
        units: 'm³',
        totalFlag: false
      });
    });
  });

  experiment('mapMeters', () => {
    test('returns an empty array when reading type is "estimated"', async () => {
      const column = [];
      const result = csvMapper._mapMeters(column, 'estimated');
      expect(result).to.equal([]);
    });

    test('returns meter details when reading type is "measured"', async () => {
      const column = ['', '', '', '', 'Superpump', '1234'];
      const result = csvMapper._mapMeters(column, 'measured');
      expect(result).to.equal([{
        meterDetailsProvided: true,
        manufacturer: 'Superpump',
        serialNumber: '1234',
        multiplier: 1
      }]);
    });

    test('returns meter details with meterDetailsProvided flag true even when manufacturer/serial are blank"', async () => {
      const column = ['', '', '', '', '', ''];
      const result = csvMapper._mapMeters(column, 'measured');
      expect(result).to.equal([{
        meterDetailsProvided: true,
        manufacturer: '',
        serialNumber: '',
        multiplier: 1
      }]);
    });
  });

  experiment('mapReturn', () => {
    const context = {
      headers,
      user,
      today: '2019-05-07'
    };

    test('maps common return data to return object', async () => {
      const result = csvMapper._mapReturn(nilReturn, context);
      expect(result.returnId).to.equal('v1:1:01/123:01234:2019-04-01:2020-03-31');
      expect(result.licenceNumber).to.equal('01/123');
      expect(result.receivedDate).to.equal('2019-05-07');
      expect(result.startDate).to.equal('2019-04-01');
      expect(result.endDate).to.equal('2020-03-31');
      expect(result.isUnderQuery).to.equal(false);
      expect(result.versionNumber).to.equal(1);
      expect(result.user).to.equal({
        email: 'mail@example.com',
        type: 'internal',
        entityId: 'entity_id'
      });
    });

    test('maps a nil return object', async () => {
      const result = csvMapper._mapReturn(nilReturn, context);

      expect(result.isNil).to.equal(true);
      expect(result.reading).to.be.undefined();
      expect(result.lines).to.be.undefined();
      expect(result.meters).to.be.undefined();
    });

    test('maps a non-nil return object', async () => {
      const result = csvMapper._mapReturn(column, context);

      expect(result.isNil).to.equal(false);
      expect(result.reading).to.be.an.object();
      expect(result.meters[0]).to.be.an.object();
      expect(result.lines).to.be.an.array();
      expect(result.frequency).to.be.a.string();
    });
  });

  experiment('isEmptyReturn', () => {
    test('returns true if the return is empty', async () => {
      const result = csvMapper._isEmptyReturn(emptyReturn);
      expect(result).to.equal(true);
    });

    test('returns false for non-empty returns', async () => {
      const result = csvMapper._isEmptyReturn(nilReturn);
      expect(result).to.equal(false);
    });
  });

  experiment('mapCsv', () => {
    test('maps a CSV string to an array of return objects, ignoring empty returns', async () => {
      const result = await csvMapper.mapCsv(csv, user, '2019-05-07');
      expect(result).to.be.an.array();
      expect(result.length).to.equal(1);

      const [ ret ] = result;

      const keys = Object.keys(ret);
      expect(keys).to.include([
        'returnId',
        'licenceNumber',
        'receivedDate',
        'startDate',
        'endDate',
        'isNil',
        'isUnderQuery',
        'versionNumber',
        'isCurrent',
        'user',
        'reading',
        'lines',
        'meters'
      ]);
    });
  });
});
