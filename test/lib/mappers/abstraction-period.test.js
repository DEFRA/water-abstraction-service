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
  abstractionPeriodEndMonth: 4,
  scheme: 'alcs'
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

  experiment('.modelToHelpers', () => {
    test('maps to a plain object', async () => {
      const absPeriod = new AbstractionPeriod();
      absPeriod.fromHash({
        startDay: 1,
        startMonth: 4,
        endDay: 31,
        endMonth: 10
      });

      expect(abstractionPeriodMapper.modelToHelpers(absPeriod)).to.equal({
        startDay: 1,
        startMonth: 4,
        endDay: 31,
        endMonth: 10
      });
    });
  });

  experiment('.pojoToModel', () => {
    test('maps a plain object to an AbstractionPeriod model', async () => {
      const obj = {
        startDay: 1,
        startMonth: 4,
        endDay: 31,
        endMonth: 10
      };
      const model = abstractionPeriodMapper.pojoToModel(obj);
      expect(model).to.be.an.instanceof(AbstractionPeriod);
      expect(model.startDay).to.equal(obj.startDay);
      expect(model.startMonth).to.equal(obj.startMonth);
      expect(model.endDay).to.equal(obj.endDay);
      expect(model.endMonth).to.equal(obj.endMonth);
    });
  });
});
