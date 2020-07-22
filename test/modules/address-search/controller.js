'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const Address = require('../../../src/lib/models/address');
const addressService = require('../../../src/modules/address-search/services/address-service');
const controller = require('../../../src/modules/address-search/controller');

experiment('modules/application-state/controller', () => {
  beforeEach(async () => {
    sandbox.stub(addressService, 'getAddresses').resolves({
      data: [
        new Address()
      ]
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getAddressSearch', () => {
    let request, result;

    beforeEach(async () => {
      request = {
        query: { q: 'TT1 1TT' }
      };
      result = await controller.getAddressSearch(request);
    });

    test('fetches the data via the service', async () => {
      expect(addressService.getAddresses.calledWith('TT1 1TT')).to.be.true();
    });

    test('returns the data', async () => {
      expect(result.data).to.be.an.array().length(1);
      expect(result.data[0] instanceof Address).to.be.true();
    });
  });
});
