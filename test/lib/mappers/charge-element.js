'use strict';

const uuid = require('uuid/v4');

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const ChargeElement = require('../../../src/lib/models/charge-element');
const DateRange = require('../../../src/lib/models/date-range');
const PurposeUse = require('../../../src/lib/models/purpose-use');
const { CHARGE_SEASON } = require('../../../src/lib/models/constants');

const chargeElementsMapper = require('../../../src/lib/mappers/charge-element');
const AbstractionPeriod = require('../../../src/lib/models/abstraction-period');

const data = {
  chargeElement: {
    chargeElementId: '90d4af8a-1717-452c-84bd-467a7d55ade4',
    source: 'supported',
    season: CHARGE_SEASON.summer,
    loss: 'high'
  },
  timeLimitedChargeElement: {
    chargeElementId: '90d4af8a-1717-452c-84bd-467a7d55ade4',
    source: 'supported',
    season: CHARGE_SEASON.summer,
    loss: 'high',
    timeLimitedStartDate: '2012-03-01',
    timeLimitedEndDate: '2020-10-31'
  },
  dbRow: {
    charge_element_id: '90d4af8a-1717-452c-84bd-467a7d55ade4',
    source: 'supported',
    season: CHARGE_SEASON.summer,
    loss: 'high'
  },
  dbRowWithPurposeUse: {
    charge_element_id: '90d4af8a-1717-452c-84bd-467a7d55ade4',
    source: 'supported',
    season: CHARGE_SEASON.summer,
    loss: 'high',
    purposeUse: {
      legacy_id: 'A',
      purpose_use_id: uuid(),
      description: 'Trickling parsnips',
      lossFactor: 'high',
      isTwoPartTariff: false,
      dateCreated: '2000-01-01',
      dateUpdated: '2000-01-01'
    }
  }
};

experiment('lib/mappers/charge-element', () => {
  let result;

  experiment('.dbToModel', () => {
    beforeEach(async () => {
      result = chargeElementsMapper.dbToModel(data.dbRow);
    });

    test('returns an instance of ChargeElement', async () => {
      expect(result instanceof ChargeElement).to.be.true();
    });

    test('sets the .id property', async () => {
      expect(result.id).to.equal(data.chargeElement.chargeElementId);
    });

    test('sets the .source property', async () => {
      expect(result.source).to.equal(data.chargeElement.source);
    });

    test('sets the .season property', async () => {
      expect(result.season).to.equal(data.chargeElement.season);
    });

    test('sets the .loss property', async () => {
      expect(result.loss).to.equal(data.chargeElement.loss);
    });

    experiment('when the database row does not contain a purpose use', () => {
      test('the purposeUse property is not set', async () => {
        expect(result.purposeUse).to.be.undefined();
      });
    });

    experiment('when the database row contains a purpose use', () => {
      beforeEach(async () => {
        result = chargeElementsMapper.dbToModel(data.dbRowWithPurposeUse);
      });

      test('the purposeUse property is set', async () => {
        expect(result.purposeUse instanceof PurposeUse).to.be.true();
      });
    });

    experiment('when the database row contains time-limited dates', () => {
      beforeEach(async () => {
        result = chargeElementsMapper.dbToModel(data.timeLimitedChargeElement);
      });

      test('the timeLimitedPeriod property is set', async () => {
        expect(result.timeLimitedPeriod instanceof DateRange).to.be.true();
        expect(result.timeLimitedPeriod.startDate).to.equal(data.timeLimitedChargeElement.timeLimitedStartDate);
        expect(result.timeLimitedPeriod.endDate).to.equal(data.timeLimitedChargeElement.timeLimitedEndDate);
      });
    });
  });

  experiment('.pojoToModel', () => {
    let data, model;
    beforeEach(async () => {
      data = {
        id: uuid(),
        source: 'supported',
        loss: 'low',
        season: 'summer',
        eiucSource: 'other',
        abstractionPeriod: {
          startDay: 1,
          startMonth: 1,
          endDay: 31,
          endMonth: 12
        },
        purposeUse: {
          id: uuid()
        }
      };
      model = chargeElementsMapper.pojoToModel(data);
    });

    test('returns a ChargeElement model', async () => {
      expect(model).to.be.an.instanceof(ChargeElement);
    });

    test('maps charge element properties', async () => {
      expect(model.id).to.equal(data.id);
      expect(model.source).to.equal(data.source);
      expect(model.season).to.equal(data.season);
      expect(model.loss).to.equal(data.loss);
    });

    test('maps the abstraction period', async () => {
      expect(model.abstractionPeriod).to.be.an.instanceof(AbstractionPeriod);
      expect(model.abstractionPeriod.startDay).to.equal(1);
      expect(model.abstractionPeriod.startMonth).to.equal(1);
      expect(model.abstractionPeriod.endDay).to.equal(31);
      expect(model.abstractionPeriod.endMonth).to.equal(12);
    });

    test('maps the purpose use', async () => {
      expect(model.purposeUse).to.be.an.instanceof(PurposeUse);
      expect(model.purposeUse.id).to.equal(data.purposeUse.id);
    });

    test('the abstraction period is undefined if not specified in the data', async () => {
      delete data.abstractionPeriod;
      model = chargeElementsMapper.pojoToModel(data);
      expect(model.abstractionPeriod).to.be.undefined();
    });

    test('the purpose use is undefined if not specified in the data', async () => {
      delete data.purposeUse;
      model = chargeElementsMapper.pojoToModel(data);
      expect(model.purposeUse).to.be.undefined();
    });
  });
});
