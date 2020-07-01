'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const AbstractionPeriod = require('../../../src/lib/models/abstraction-period');
const abstractionPeriodMapper = require('../../../src/lib/mappers/abstraction-period');

const dbRow = {
  abstractionPeriodStartDay: 1,
  abstractionPeriodStartMonth: 2,
  abstractionPeriodEndDay: 3,
  abstractionPeriodEndMonth: 4
};

experiment('modules/billing/mappers/abstraction-period', () => {
  experiment('.dbToModel', () => {
    let result;

    beforeEach(async () => {
      result = abstractionPeriodMapper.dbToModel(dbRow);
    });

    test('returns an AbstractionPeriod instance', async () => {
      expect(result instanceof AbstractionPeriod).to.be.true();
    });

    test('has the expected startDay value', async () => {
      expect(result.startDay).to.equal(1);
    });
    test('has the expected startMonth value', async () => {
      expect(result.startMonth).to.equal(2);
    });
    test('has the expected endDay value', async () => {
      expect(result.endDay).to.equal(3);
    });
    test('has the expected endMonth value', async () => {
      expect(result.endMonth).to.equal(4);
    });
  });
});
