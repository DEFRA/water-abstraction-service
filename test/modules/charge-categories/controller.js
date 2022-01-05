'use strict';

const Lab = require('@hapi/lab');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const repos = require('../../../src/lib/connectors/repos');

const chargeCategories = [{
  billingChargeCategoryId: '3e920b4f-5563-4c7a-8583-5e1c66ab4f83',
  reference: '2.1.1',
  subsistenceCharge: 9700,
  description: 'Low loss tidal abstraction of water up to and including 25,002 megalitres a year where no model applies',
  shortDescription: 'Low loss tidal abstraction of water up to and including 25,002 megalitres a year where no model applies',
  dateCreated: '2021-11-18T12:00:00.585Z',
  dateUpdated: '2021-12-22T10:42:50.334Z',
  minVolume: 0,
  maxVolume: 25002,
  isTidal: true,
  lossFactor: 'Low',
  modelTier: 'No model',
  restrictedSource: false
}];

const controller = require('../../../src/modules/charge-categories/controller');

experiment('./src/modules/change-reasons/controller.js', () => {
  beforeEach(async () => {
    sandbox.stub(repos.chargeCategories, 'findOneByProperties').resolves(chargeCategories);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getChargeCategoryByProperties', () => {
    let response;

    beforeEach(async () => {
      const request = {
        query: {
          source: 'Tidal',
          volume: '123',
          loss: 'High',
          availability: 'Available',
          model: 'Tier 1'
        }
      };
      response = await controller.getChargeCategoryByProperties(request);
    });

    test('calls change reasons repo', async () => {
      expect(repos.chargeCategories.findOneByProperties.called).to.be.true();
    });

    test('returns change reasons array mapped to model', async () => {
      expect(response[0].id).to.equal(chargeCategories[0].changeReasonId);
      expect(response[0].description).to.equal(chargeCategories[0].description);
    });
  });
});
