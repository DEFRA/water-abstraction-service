'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const Address = require('../../../../src/lib/models/address');
const eaAddressFacadeApi = require('../../../../src/lib/connectors/ea-address-facade');
const addressService = require('../../../../src/modules/address-search/services/address-service');

experiment('modules/application-state/controller', () => {
  beforeEach(async () => {
    sandbox.stub(eaAddressFacadeApi, 'getAddressesByPostcode').resolves({
      results: [{
        uprn: '12345',
        organisation: 'Big Co',
        premises: 'Big farm',
        street_address: 'Windy road',
        locality: 'Country vale',
        city: 'Testington',
        postcode: 'TT1 1TT',
        country: 'United Kingdom'
      }]
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getAddresses', () => {
    let result;

    beforeEach(async () => {
      result = await addressService.getAddressesByPostcode('TT1 1TT');
    });

    test('calles the EA address facade with the query', async () => {
      expect(eaAddressFacadeApi.getAddressesByPostcode.calledWith('TT1 1TT'));
    });

    test('resolves with mapped addresses in { data } envelope', async () => {
      expect(result.data).to.be.an.array().length(1);
      expect(result.data[0] instanceof Address).to.be.true();
    });
  });
});
