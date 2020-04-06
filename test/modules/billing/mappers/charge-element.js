const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const ChargeElement = require('../../../../src/lib/models/charge-element');
const Purpose = require('../../../../src/lib/models/purpose');
const DateRange = require('../../../../src/lib/models/date-range');
const { CHARGE_SEASON } = require('../../../../src/lib/models/constants');

const chargeElementsMapper = require('../../../../src/modules/billing/mappers/charge-element');

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
      id: 'A',
      description: 'Trickling parsnips'
    }
  }
};

experiment('modules/billing/mappers/charge-element', () => {
  let result;

  experiment('.chargeToModel', () => {
    beforeEach(async () => {
      result = chargeElementsMapper.chargeToModel(data.chargeElement);
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

    experiment('when charge element has time limited dates', async => {
      test('sets the .timeLimitedPeriod property when both dates are present', async () => {
        result = chargeElementsMapper.chargeToModel(data.timeLimitedChargeElement);
        const timeLimitedPeriod = new DateRange(
          data.timeLimitedChargeElement.timeLimitedStartDate,
          data.timeLimitedChargeElement.timeLimitedEndDate
        );
        expect(result.timeLimitedPeriod).to.equal(timeLimitedPeriod);
      });

      test('sets the .timeLimitedPeriod property when only end date is present', async () => {
        result = chargeElementsMapper.chargeToModel({ ...data.timeLimitedChargeElement, timeLimitedStartDate: null });
        const timeLimitedPeriod = new DateRange(
          null,
          data.timeLimitedChargeElement.timeLimitedEndDate
        );
        expect(result.timeLimitedPeriod).to.equal(timeLimitedPeriod);
      });
    });

    experiment('when charge element does not have time limited dates', async => {
      beforeEach(() => {
        result = chargeElementsMapper.chargeToModel(data.chargeElement);
      });
      test('sets the .timeLimitedPeriod property', async () => {
        expect(result.timeLimitedPeriod).to.be.undefined();
      });
    });
  });

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

      test('the purposeUse property is not set', async () => {
        expect(result.purposeUse instanceof Purpose).to.be.true();
      });
    });
  });
});
