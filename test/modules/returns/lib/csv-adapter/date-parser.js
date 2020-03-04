const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const dateParser = require('../../../../../src/modules/returns/lib/csv-adapter/date-parser');

const dayDateFormats = [
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

const weekDateFormats = [
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

const monthDateFormats = [
  'Aug 2019',
  'August 2019',
  'Aug 19',
  'August 19',
  'Aug-2019',
  'August-2019',
  'Aug-19',
  'August-19'
];

experiment('modules/returns/lib/csv-adapter/date-parser', () => {
  experiment('.parse', async () => {
    experiment('returns the correct type of return line', () => {
      test('week', () => {
        const returnLine = dateParser.parse('week ending 14 April 2018');
        expect(returnLine).to.equal({
          startDate: '2018-04-08',
          endDate: '2018-04-14',
          timePeriod: 'week'
        });
      });
      test('day', () => {
        const returnLine = dateParser.parse('14 April 2018');
        expect(returnLine).to.equal({
          startDate: '2018-04-14',
          endDate: '2018-04-14',
          timePeriod: 'day'
        });
      });
      test('month', () => {
        const returnLine = dateParser.parse('Apr-18');
        expect(returnLine).to.equal({
          startDate: '2018-04-01',
          endDate: '2018-04-30',
          timePeriod: 'month'
        });
      });
    });
    test('returns null if date is invalid', () => {
      const result = dateParser.parse('1 April 2');
      expect(result).to.be.null();
    });
  });

  experiment('.validate', async () => {
    test('returns true the parse method returns a return line', () => {
      const validation = dateParser.validate('Apr-18');
      expect(validation).to.be.true();
    });

    test('returns false the parse method returns null', () => {
      const validation = dateParser.validate('Apr-1');
      expect(validation).to.be.false();
    });
  });

  experiment('.getDateFrequency', async () => {
    test('returns "week" if date startsWith "week ending"', () => {
      const frequency = dateParser._getDateFrequency('week ending 14 April 2018');
      expect(frequency).to.equal('week');
    });

    dayDateFormats.forEach(format => {
      test(`returns "day" for day format: ${format}`, () => {
        const frequency = dateParser._getDateFrequency(format);
        expect(frequency).to.equal('day');
      });
    });

    monthDateFormats.forEach(format => {
      test(`returns "month" for month format: ${format}`, () => {
        const frequency = dateParser._getDateFrequency(format);
        expect(frequency).to.equal('month');
      });
    });

    test('returns undefined if date does not fit any format', () => {
      const frequency = dateParser._getDateFrequency('13 April 2');
      expect(frequency).to.be.undefined();
    });
  });

  experiment('.createDay', async () => {
    test('creates a day return line skeleton from preferred data format', async () => {
      const result = dateParser._createDay('7 May 2019');
      expect(result).to.equal({
        startDate: '2019-05-07',
        endDate: '2019-05-07',
        timePeriod: 'day'
      });
    });

    dayDateFormats.forEach(format => {
      test(`${format} creates a day return line skeleton for other date formats`, async () => {
        const result = dateParser._createDay(format);
        expect(result).to.equal({
          startDate: '2019-08-07',
          endDate: '2019-08-07',
          timePeriod: 'day'
        });
      });
    });

    test('creates a day return line skeleton from DD  data format', async () => {
      const result = dateParser._createDay('7 May 2019');
      expect(result).to.equal({
        startDate: '2019-05-07',
        endDate: '2019-05-07',
        timePeriod: 'day'
      });
    });
  });

  experiment('.createWeek', async () => {
    test('create a weekly return line skeleton from the preferred date format', async () => {
      const result = dateParser._createWeek('11 May 2019');
      expect(result).to.equal({
        startDate: '2019-05-05',
        endDate: '2019-05-11',
        timePeriod: 'week'
      });
    });

    weekDateFormats.forEach(format => {
      test(`${format} creates a day return line skeleton for other date formats`, async () => {
        const result = dateParser._createWeek(format);
        expect(result).to.equal({
          startDate: '2019-07-28',
          endDate: '2019-08-03',
          timePeriod: 'week'
        });
      });
    });
  });

  experiment('.createMonth', async () => {
    test('creates a month return line skeleton for preferred format', async () => {
      const result = dateParser._createMonth('May 2019');
      expect(result).to.equal({
        startDate: '2019-05-01',
        endDate: '2019-05-31',
        timePeriod: 'month'
      });
    });

    monthDateFormats.forEach(format => {
      test(`${format} creates a day return line skeleton for other date formats`, async () => {
        const result = dateParser._createMonth(format);
        expect(result).to.equal({
          startDate: '2019-08-01',
          endDate: '2019-08-31',
          timePeriod: 'month'
        });
      });
    });
  });
});
