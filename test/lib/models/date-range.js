'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const DateRange = require('../../../src/lib/models/date-range');

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

    test('throws an error if set to null', async () => {
      const func = () => {
        dateRange.endDate = null;
      };
      expect(func).to.throw();
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
});
