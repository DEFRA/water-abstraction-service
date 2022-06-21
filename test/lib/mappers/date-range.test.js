'use strict';

const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const DateRange = require('../../../src/lib/models/date-range');
const dateRangeMapper = require('../../../src/lib/mappers/date-range');

experiment('src/lib/mappers/date-range', () => {
  experiment('.pojoToModel', () => {
    experiment('when given a valid date range', () => {
      const input = {
        startDate: new Date(),
        endDate: new Date()
      };
      const result = dateRangeMapper.pojoToModel(input);
      test('returns a date range object', async () => {
        expect(result).to.be.an.instanceOf(DateRange);
      });
    });

    experiment('when given an undefined input', () => {
      const result = dateRangeMapper.pojoToModel(undefined);
      test('returns a date range object', async () => {
        expect(result).to.equal(null);
      });
    });
  });
});
