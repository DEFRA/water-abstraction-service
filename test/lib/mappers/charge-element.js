'use strict';

const uuid = require('uuid/v4');

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const ChargeElement = require('../../../src/lib/models/charge-element');
const ChargeAgreement = require('../../../src/lib/models/charge-agreement');
const DateRange = require('../../../src/lib/models/date-range');
const PurposeUse = require('../../../src/lib/models/purpose-use');
const { CHARGE_SEASON } = require('../../../src/lib/models/constants');

const chargeElementsMapper = require('../../../src/lib/mappers/charge-element');

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
  },
  dbRowWithAgreements: {
    charge_element_id: '90d4af8a-1717-452c-84bd-467a7d55ade4',
    source: 'supported',
    season: CHARGE_SEASON.summer,
    loss: 'high',
    agreements: [{
      chargeAgreementId: '2467e7d6-2d9e-42c9-843e-e670011d3a76',
      chargeElementId: '01a5e49b-015f-40c8-aa8e-bbe86fed380e',
      agreementCode: 'S126',
      startDate: '2001-04-01',
      endDate: null,
      signedDate: null,
      fileReference: 'SummerRecord',
      description: null,
      dateCreated: '2020-05-06T14:00:18.802Z',
      dateUpdated: '2020-05-16T14:00:15.484Z'
    }]
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

    experiment('when the database row contains charge agreements', () => {
      beforeEach(async () => {
        result = chargeElementsMapper.dbToModel(data.dbRowWithAgreements);
      });

      test('the agreements property is set', async () => {
        expect(result.agreements[0] instanceof ChargeAgreement).to.be.true();
        expect(result.agreements[0].code).to.equal('S126');
      });
    });
  });
});
