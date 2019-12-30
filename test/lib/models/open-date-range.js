'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const OpenDateRange = require('../../../src/lib/models/open-date-range');

const TEST_START_DATE = '2019-06-01';
const TEST_END_DATE = '2019-12-25';

experiment('lib/models/date-range', () => {
  experiment('constructor', () => {
    test('can be constructed with no dates', async () => {
      const dateRange = new OpenDateRange();
      expect(dateRange.startDate).to.be.undefined();
      expect(dateRange.endDate).to.be.undefined();
    });

    test('can be constructed with a start date', async () => {
      const dateRange = new OpenDateRange(TEST_START_DATE);
      expect(dateRange.startDate).to.equal(TEST_START_DATE);
      expect(dateRange.endDate).to.be.undefined();
    });

    test('can be constructed with a start and end date', async () => {
      const dateRange = new OpenDateRange(TEST_START_DATE, TEST_END_DATE);
      expect(dateRange.startDate).to.equal(TEST_START_DATE);
      expect(dateRange.endDate).to.equal(TEST_END_DATE);
    });

    test('can be constructed with a start and null as the end date', async () => {
      const dateRange = new OpenDateRange(TEST_START_DATE, null);
      expect(dateRange.startDate).to.equal(TEST_START_DATE);
      expect(dateRange.endDate).to.equal(null);
    });
  });

  experiment('.startDate', () => {
    let dateRange;

    beforeEach(async () => {
      dateRange = new OpenDateRange();
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
      dateRange = new OpenDateRange();
    });

    test('can set a valid end date', async () => {
      dateRange.endDate = TEST_END_DATE;
      expect(dateRange.endDate).to.equal(TEST_END_DATE);
    });

    test('can set a end date to null', async () => {
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
});
