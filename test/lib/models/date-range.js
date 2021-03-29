'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const DateRange = require('../../../src/lib/models/date-range');

const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(require('moment'));

const TEST_START_DATE = '2019-06-01';
const TEST_END_DATE = '2019-12-25';

experiment('lib/models/date-range', () => {
  experiment('constructor', () => {
    test('can be constructed with no dates', async () => {
      const dateRange = new DateRange();
      expect(dateRange.startDate).to.be.undefined();
      expect(dateRange.endDate).to.be.undefined();
    });

    test('can be constructed with a start date', async () => {
      const dateRange = new DateRange(TEST_START_DATE);
      expect(dateRange.startDate).to.equal(TEST_START_DATE);
      expect(dateRange.endDate).to.be.undefined();
    });

    test('can be constructed with a start and end date', async () => {
      const dateRange = new DateRange(TEST_START_DATE, TEST_END_DATE);
      expect(dateRange.startDate).to.equal(TEST_START_DATE);
      expect(dateRange.endDate).to.equal(TEST_END_DATE);
    });
  });

  experiment('.startDate', () => {
    let dateRange;

    beforeEach(async () => {
      dateRange = new DateRange();
    });

    test('can set a valid start date', async () => {
      dateRange.startDate = TEST_START_DATE;
      expect(dateRange.startDate).to.equal(TEST_START_DATE);
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        dateRange.startDate = null;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to an invalid date', async () => {
      const func = () => {
        dateRange.startDate = 'invalid-date';
      };
      expect(func).to.throw();
    });
  });

  experiment('.endDate', () => {
    let dateRange;

    beforeEach(async () => {
      dateRange = new DateRange();
    });

    test('can set a valid end date', async () => {
      dateRange.endDate = TEST_END_DATE;
      expect(dateRange.endDate).to.equal(TEST_END_DATE);
    });

    test('can be set to null to create an open-ended range', async () => {
      dateRange.endDate = null;
      expect(dateRange.endDate).to.equal(null);
    });

    test('throws an error if set to an invalid date', async () => {
      const func = () => {
        dateRange.endDate = 'invalid-date';
      };
      expect(func).to.throw();
    });
  });

  experiment('.toJSON', () => {
    let dateRange, result;

    beforeEach(async () => {
      dateRange = new DateRange(TEST_START_DATE, TEST_END_DATE);
      result = dateRange.toJSON();
    });

    test('returns the properties as a plain object', async () => {
      expect(result).to.equal({
        startDate: TEST_START_DATE,
        endDate: TEST_END_DATE
      });
    });
  });

  experiment('.toMomentRange', () => {
    test('converts the DateRange to a moment range instance', async () => {
      const dateRange = new DateRange(TEST_START_DATE, TEST_END_DATE);
      const momentRange = dateRange.toMomentRange();
      expect(momentRange.start.format('YYYY-MM-DD')).to.equal(TEST_START_DATE);
      expect(momentRange.end.format('YYYY-MM-DD')).to.equal(TEST_END_DATE);
    });
  });

  experiment('.fromMomentRange', () => {
    test('converts the moment range to a DateRange instance', async () => {
      const momentRange = moment.range(TEST_START_DATE, TEST_END_DATE);
      const dateRange = DateRange.fromMomentRange(momentRange);
      expect(dateRange.startDate).to.equal(TEST_START_DATE);
      expect(dateRange.endDate).to.equal(TEST_END_DATE);
    });
  });

  experiment('.includes', () => {
    let dateRange;

    beforeEach(async () => {
      dateRange = new DateRange(TEST_START_DATE, TEST_END_DATE);
    });

    test('return false for a date before the start date', async () => {
      expect(dateRange.includes('2019-05-31')).to.be.false();
    });

    test('return true for the start date', async () => {
      expect(dateRange.includes(TEST_START_DATE)).to.be.true();
    });

    test('return true for a date within the range', async () => {
      expect(dateRange.includes('2019-08-05')).to.be.true();
    });

    test('return true for the end date', async () => {
      expect(dateRange.includes(TEST_END_DATE)).to.be.true();
    });

    test('return false for a date after the end date', async () => {
      expect(dateRange.includes('2019-12-26')).to.be.false();
    });
  });

  experiment('.overlaps', () => {
    const testPair = (...dates) => {
      const rangeA = new DateRange(dates[0], dates[1]);
      const rangeB = new DateRange(dates[2], dates[3]);
      return rangeA.overlaps(rangeB);
    };

    test('returns false when no overlap', async () => {
      const isOverlap = testPair(
        '2019-01-01', '2019-05-01',
        '2019-05-02', '2019-12-31'
      );
      expect(isOverlap).to.be.false();
    });

    test('returns true when end date of earlier range is start date of later range', async () => {
      const isOverlap = testPair(
        '2019-01-01', '2019-05-01',
        '2019-05-01', '2019-12-31'
      );
      expect(isOverlap).to.be.true();
    });

    test('returns true when there is an overlap', async () => {
      const isOverlap = testPair(
        '2019-01-01', '2019-05-01',
        '2019-04-01', '2019-12-31'
      );
      expect(isOverlap).to.be.true();
    });
    test('returns true when the ranges are the same', async () => {
      const isOverlap = testPair(
        '2019-01-01', '2019-05-01',
        '2019-01-01', '2019-05-01'
      );
      expect(isOverlap).to.be.true();
    });
  });

  experiment('.days', () => {
    test('returns 1 for a single day', async () => {
      const days = new DateRange('2019-01-01', '2019-01-01').days;
      expect(days).to.equal(1);
    });

    test('returns 7 for a week', async () => {
      const days = new DateRange('2019-01-01', '2019-01-07').days;
      expect(days).to.equal(7);
    });

    test('returns 31 for a month', async () => {
      const days = new DateRange('2019-01-01', '2019-01-31').days;
      expect(days).to.equal(31);
    });

    test('returns undefined if no end date', async () => {
      const days = new DateRange('2019-01-01', null).days;
      expect(days).to.be.undefined();
    });
  });

  experiment('.isFinancialYear', () => {
    test('returns false if not a match', async () => {
      const dateRange = new DateRange('2019-01-01', '2019-12-31');
      expect(dateRange.isFinancialYear).to.be.false();
    });

    test('returns false if not a match', async () => {
      const dateRange = new DateRange('2019-04-01', '2021-03-31');
      expect(dateRange.isFinancialYear).to.be.false();
    });

    test('returns true if a match', async () => {
      const dateRange = new DateRange('2019-04-01', '2020-03-31');
      expect(dateRange.isFinancialYear).to.be.true();
    });
  });

  experiment('.isSameOrAfter', () => {
    const dateRange = new DateRange('2019-01-01', '2019-12-31');

    test('returns true if starts on the supplied date', async () => {
      expect(dateRange.isSameOrAfter('2019-01-01')).to.be.true();
    });

    test('returns true if starts after the supplied date', async () => {
      expect(dateRange.isSameOrAfter('2018-12-31')).to.be.true();
    });

    test('returns true if starts before the supplied date', async () => {
      expect(dateRange.isSameOrAfter('2019-01-02')).to.be.false();
    });
  });
});
