const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const ChargeElement = require('../../../../src/lib/models/charge-element');
const chargeElementsService = require('../../../../src/modules/billing/services/charge-elements-service');

const data = {
  chargeElement: {
    chargeElementId: '90d4af8a-1717-452c-84bd-467a7d55ade4',
    source: 'supported',
    season: 'summer',
    loss: 'high'
  }
};

experiment('modules/billing/services/charge-elements-service', () => {
  let result;

  experiment('.mapRowToModel', () => {
    beforeEach(async () => {
      result = chargeElementsService.mapRowToModel(data.chargeElement);
    });

    test('returns an instance of Agreement', async () => {
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
  });
});
