'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const ReturnRequirement = require('../../../src/lib/models/return-requirement');
const AbstractionPeriod = require('../../../src/lib/models/abstraction-period');
const DateRange = require('../../../src/lib/models/date-range');
const Return = require('../../../src/lib/models/return');
const returnMapper = require('../../../src/lib/mappers/return');

const createReturn = (overrides = {}) => ({
  return_id: 'v1:1:01/234/ABC:1234:2019-04-01:2020-03-31',
  start_date: '2019-04-01',
  end_date: '2020-03-31',
  under_query: true,
  due_date: '2020-04-29',
  received_date: '2020-05-02',
  status: Return.RETURN_STATUS.due,
  metadata: {
    isSummer: true,
    nald: {
      periodStartDay: overrides.periodStartDay || '5',
      periodStartMonth: '3',
      periodEndDay: '31',
      periodEndMonth: '12'
    }
  }
});

experiment('modules/billing/mappers/return', () => {
  experiment('.returnsServiceToModel', () => {
    let model, returnRequirement;

    experiment('when the abs period properties are not null', () => {
      beforeEach(async () => {
        returnRequirement = new ReturnRequirement();
        model = returnMapper.returnsServiceToModel(createReturn(), returnRequirement);
      });

      test('the .dateRange property is mapped', async () => {
        expect(model.dateRange).to.be.an.instanceof(DateRange);
        expect(model.dateRange.startDate).to.equal('2019-04-01');
        expect(model.dateRange.endDate).to.equal('2020-03-31');
      });

      test('the .isUnderQuery property is mapped', async () => {
        expect(model.isUnderQuery).to.be.true();
      });

      test('the .isSummer property is mapped', async () => {
        expect(model.isSummer).to.be.true();
      });

      test('the .receivedDate property is mapped', async () => {
        expect(model.receivedDate).to.equal('2020-05-02');
      });

      test('the .status property is mapped', async () => {
        expect(model.status).to.equal(Return.RETURN_STATUS.due);
      });

      test('the .abstractionPeriod property is mapped', async () => {
        expect(model.abstractionPeriod).to.be.an.instanceof(AbstractionPeriod);
        expect(model.abstractionPeriod.startDay).to.equal(5);
        expect(model.abstractionPeriod.startMonth).to.equal(3);
        expect(model.abstractionPeriod.endDay).to.equal(31);
        expect(model.abstractionPeriod.endMonth).to.equal(12);
      });

      test('the .returnRequirement property is populated', async () => {
        expect(model.returnRequirement).to.equal(returnRequirement);
      });
    });

    experiment('when one or more of the abs period properties are null', () => {
      beforeEach(async () => {
        returnRequirement = new ReturnRequirement();
        model = returnMapper.returnsServiceToModel(createReturn({ periodStartDay: 'null' }), returnRequirement);
      });

      test('the .abstractionPeriod property is null', async () => {
        expect(model.abstractionPeriod).to.be.null();
      });
    });

    experiment('when the second param is omitted', () => {
      beforeEach(async () => {
        model = returnMapper.returnsServiceToModel(createReturn({ periodStartDay: 'null' }));
      });

      test('the .returnRequirement property is undefined', async () => {
        expect(model.returnRequirement).to.be.undefined();
      });
    });
  });
});
