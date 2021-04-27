const { expect } = require('@hapi/code');
const { find } = require('lodash');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();
const moment = require('moment');
const csvMapper = require('../../../../../src/modules/returns/lib/csv-adapter/mapper');
const dateParser = require('../../../../../src/modules/returns/lib/csv-adapter/date-parser');

const headers = [
  'Licence number',
  'Return reference',
  'Site description',
  'Purpose',
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
  'Test site',
  'Test purpose',
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
  'Test site',
  'Test purpose',
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
  'Test site',
  'Test purpose',
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
Site description,Test site,Test site
Purpose,Test purpose,Test purpose
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

const getWeekLine = endDate => {
  return {
    startDate: moment(endDate).subtract(6, 'days').format('YYYY-MM-DD'),
    endDate,
    timePeriod: 'week'
  };
};

experiment('returns CSV to JSON mapper', () => {
  beforeEach(async () => {
    sandbox.stub(dateParser, 'parse');
    dateParser.parse.withArgs('Week ending 6 April 2019').returns(getWeekLine('2019-04-06'));
    dateParser.parse.withArgs('Week ending 13 April 2019').returns(getWeekLine('2019-04-13'));
    dateParser.parse.withArgs('Week ending 20 April 2019').returns(getWeekLine('2019-04-20'));
  });

  afterEach(() => sandbox.restore());

  experiment('normalize', () => {
    test('should trim and lowercase values', async () => {
      const result = csvMapper._normalize('  Some Data ');
      expect(result).to.equal('some data');
    });
  });

  experiment('createReturnLine', () => {
    test('calls dateParser with dateLabel', async () => {
      csvMapper._createReturnLine('7 May 2019');
      expect(dateParser.parse.calledWith('7 May 2019')).to.be.true();
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

  experiment('mapLines', () => {
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
      const column = ['', '', '', '', '', 'Y'];
      const result = csvMapper._mapReading(column);
      expect(result).to.equal({
        type: 'measured',
        method: 'abstractionVolumes',
        units: 'm³',
        totalFlag: false
      });
    });

    test('maps reading type to "measured" when cell marked as "Yes"', async () => {
      const column = ['', '', '', '', '', 'Yes'];
      const result = csvMapper._mapReading(column);
      expect(result).to.equal({
        type: 'measured',
        method: 'abstractionVolumes',
        units: 'm³',
        totalFlag: false
      });
    });

    test('maps reading type to "estimated" when cell marked as "N"', async () => {
      const column = ['', '', '', '', '', 'N'];
      const result = csvMapper._mapReading(column);
      expect(result).to.equal({
        type: 'estimated',
        method: 'abstractionVolumes',
        units: 'm³',
        totalFlag: false
      });
    });

    test('maps reading type to "estimated" when cell marked as "NO"', async () => {
      const column = ['', '', '', '', '', 'NO'];
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
      const column = ['', '', '', '', '', '', 'Superpump', '1234'];
      const result = csvMapper._mapMeters(column, 'measured');
      expect(result).to.equal([{
        meterDetailsProvided: true,
        manufacturer: 'Superpump',
        serialNumber: '1234',
        multiplier: 1
      }]);
    });

    test('returns meter details with meterDetailsProvided flag true even when manufacturer/serial are blank"', async () => {
      const column = ['', '', '', '', '', '', '', ''];
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

      const [ret] = result;

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
