'use strict';

const uuid = require('uuid/v4');

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const ChargePurpose = require('../../../src/lib/models/charge-purpose');
const ChargeElement = require('../../../src/lib/models/charge-element');

const DateRange = require('../../../src/lib/models/date-range');
const Purpose = require('../../../src/lib/models/purpose');
const PurposeUse = require('../../../src/lib/models/purpose-use');

const ChargePurposeMapper = require('../../../src/lib/mappers/charge-purpose');
const AbstractionPeriod = require('../../../src/lib/models/abstraction-period');

const data = {
  chargePurpose: {
    chargePurposeId: '90d4af8a-1717-452c-84bd-467a7d55ade4',
    loss: 'high',
    chargeElementId: '6d53dddd-2ab6-449b-b28c-d6d857569b94',
    isFactorsOverridden: true
  },
  timeLimitedChargePurpose: {
    chargePurposeId: '90d4af8a-1717-452c-84bd-467a7d55ade4',
    loss: 'high',
    timeLimitedStartDate: '2012-03-01',
    timeLimitedEndDate: '2020-10-31'
  },
  dbRow: {
    charge_purpose_id: '90d4af8a-1717-452c-84bd-467a7d55ade4',
    loss: 'high',
    charge_element_id: '6d53dddd-2ab6-449b-b28c-d6d857569b94',
    factors_overridden: true
  },
  dbRowWithPurposeUse: {
    charge_purpose_id: '90d4af8a-1717-452c-84bd-467a7d55ade4',
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

experiment('lib/mappers/charge-purpose', () => {
  let result;

  experiment('.dbToModel', () => {
    beforeEach(async () => {
      result = ChargePurposeMapper.dbToModel(data.dbRow);
    });

    test('returns an instance of ChargePurpose', async () => {
      expect(result instanceof ChargePurpose).to.be.true();
    });

    test('sets the .id property', async () => {
      expect(result.id).to.equal(data.chargePurpose.chargePurposeId);
    });

    test('sets the .loss property', async () => {
      expect(result.loss).to.equal(data.chargePurpose.loss);
    });

    test('sets the .chargeElementId property', async () => {
      expect(result.chargeElementId).to.equal(data.chargePurpose.chargeElementId);
    });

    test('sets the .isFactorsOverridden property', async () => {
      expect(result.isFactorsOverridden).to.equal(data.chargePurpose.isFactorsOverridden);
    });

    experiment('when the database row does not contain a purpose use', () => {
      test('the purposeUse property is not set', async () => {
        expect(result.purposeUse).to.be.undefined();
      });
    });

    experiment('when the database row contains a purpose use', () => {
      beforeEach(async () => {
        result = ChargePurposeMapper.dbToModel(data.dbRowWithPurposeUse);
      });

      test('the purposeUse property is set', async () => {
        expect(result.purposeUse instanceof PurposeUse).to.be.true();
      });
    });

    experiment('when the database row contains time-limited dates', () => {
      beforeEach(async () => {
        result = ChargePurposeMapper.dbToModel(data.timeLimitedChargePurpose);
      });

      test('the timeLimitedPeriod property is set', async () => {
        expect(result.timeLimitedPeriod instanceof DateRange).to.be.true();
        expect(result.timeLimitedPeriod.startDate).to.equal(data.timeLimitedChargePurpose.timeLimitedStartDate);
        expect(result.timeLimitedPeriod.endDate).to.equal(data.timeLimitedChargePurpose.timeLimitedEndDate);
      });
    });
  });

  experiment('.pojoToModel', () => {
    let data, model;
    beforeEach(async () => {
      data = {
        id: uuid(),
        loss: 'low',
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
      model = ChargePurposeMapper.pojoToModel(data);
    });

    test('returns a ChargePurpose model', async () => {
      expect(model).to.be.an.instanceof(ChargePurpose);
    });

    test('maps charge purpose properties', async () => {
      expect(model.id).to.equal(data.id);
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
      model = ChargePurposeMapper.pojoToModel(data);
      expect(model.abstractionPeriod).to.be.undefined();
    });

    test('the purpose use is undefined if not specified in the data', async () => {
      delete data.purposeUse;
      model = ChargePurposeMapper.pojoToModel(data);
      expect(model.purposeUse).to.be.undefined();
    });
  });

  experiment('.modelToDb', () => {
    let model, result, chargeElement;

    beforeEach(async () => {
      chargeElement = new ChargeElement(uuid());

      const abstractionPeriod = new AbstractionPeriod();
      abstractionPeriod.fromHash({
        startDay: 1,
        startMonth: 3,
        endDay: 31,
        endMonth: 10
      });

      model = new ChargePurpose();
      model.fromHash({
        id: uuid(),
        loss: 'high',
        description: 'test purpose',
        authorisedAnnualQuantity: 34,
        billableAnnualQuantity: 26.4,
        abstractionPeriod,
        purposePrimary: new Purpose(uuid()),
        purposeSecondary: new Purpose(uuid()),
        purposeUse: new PurposeUse(uuid()),
        timeLimitedPeriod: new DateRange('2019-01-01', '2020-12-31'),
        isFactorsOverridden: false,
        isSection127AgreementEnabled: true
      });
    });

    experiment('when there are time-limited dates', () => {
      beforeEach(async () => {
        result = ChargePurposeMapper.modelToDb(model, chargeElement);
      });

      test('the properties are mapped correctly to the database fields', async () => {
        expect(result).to.equal(
          {
            chargePurposeId: model.id,
            loss: 'high',
            description: 'test purpose',
            authorisedAnnualQuantity: 34,
            billableAnnualQuantity: 26.4,
            abstractionPeriodStartDay: 1,
            abstractionPeriodStartMonth: 3,
            abstractionPeriodEndDay: 31,
            abstractionPeriodEndMonth: 10,
            purposePrimaryId: model.purposePrimary.id,
            purposeSecondaryId: model.purposeSecondary.id,
            purposeUseId: model.purposeUse.id,
            timeLimitedStartDate: '2019-01-01',
            timeLimitedEndDate: '2020-12-31',
            chargeElementId: chargeElement.id,
            factorsOverridden: model.isFactorsOverridden,
            isSection127AgreementEnabled: true
          }
        );
      });
    });

    experiment('when there is no charge element supplied', () => {
      beforeEach(async () => {
        result = ChargePurposeMapper.modelToDb(model);
      });

      test('the .chargeElementId property is not set', async () => {
        expect(Object.keys(result)).to.not.include('chargeElementId');
      });
    });

    experiment('when there are no time-limited dates', () => {
      beforeEach(async () => {
        model.timeLimitedPeriod = null;
        result = ChargePurposeMapper.modelToDb(model, chargeElement);
      });

      test('the properties are mapped correctly to the database fields', async () => {
        expect(result).to.equal(
          {
            chargePurposeId: model.id,
            loss: 'high',
            description: 'test purpose',
            authorisedAnnualQuantity: 34,
            billableAnnualQuantity: 26.4,
            abstractionPeriodStartDay: 1,
            abstractionPeriodStartMonth: 3,
            abstractionPeriodEndDay: 31,
            abstractionPeriodEndMonth: 10,
            purposePrimaryId: model.purposePrimary.id,
            purposeSecondaryId: model.purposeSecondary.id,
            purposeUseId: model.purposeUse.id,
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            chargeElementId: chargeElement.id,
            factorsOverridden: model.isFactorsOverridden,
            isSection127AgreementEnabled: true
          }
        );
      });
    });
  });
});
