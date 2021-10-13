'use strict';

const Lab = require('@hapi/lab');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');
const addressService = require('../../../src/lib/services/addresses-service');
const addressMapper = require('../../../src/lib/mappers/address');
const Address = require('../../../src/lib/models/address');

const controller = require('../../../src/modules/addresses/controller');
const { logger } = require('../../../src/logger');

const addressId = uuid();

const address = {
  address1: 'test-address-1',
  address2: 'test-address-2',
  address3: 'test-address-3',
  address4: 'test-address-4',
  town: 'test-town',
  county: 'test-county',
  country: 'test-country',
  postcode: 'test-postcode',
  isTest: true,
  dataSource: 'nald',
  uprn: 123456
};

const createRequest = () => ({
  payload: address,
  defra: {
    internalCallingUser: {
      email: 'test@example.com'
    }
  }
});

experiment('./src/modules/change-reasons/controller.js', () => {
  let addressModel;

  beforeEach(async () => {
    addressModel = new Address(addressId);
    addressModel.fromHash({
      ...address,
      addressLine1: address.address1,
      addressLine2: address.address2,
      addressLine3: address.address3,
      addressLine4: address.address4,
      source: address.dataSource
    });
    sandbox.stub(addressService, 'createAddress');
    sandbox.stub(addressMapper, 'uiToModel').returns(addressModel);
    sandbox.stub(addressMapper, 'crmToModel').returns(addressModel);
    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.postAddress', () => {
    let request, response;

    experiment('when the address is created without issue', () => {
      beforeEach(async () => {
        addressService.createAddress.resolves(addressModel);

        request = createRequest();
        response = await controller.postAddress(request);
      });

      test('creates a new address record', async () => {
        expect(addressService.createAddress.calledWith(
          addressModel
        )).to.be.true();
      });

      test('returns address mapped to model', async () => {
        expect(response).to.be.instanceOf(Address);
        expect(response.id).to.equal(addressId);
        expect(response.addressLine1).to.equal(address.address1);
        expect(response.addressLine2).to.equal(address.address2);
        expect(response.addressLine3).to.equal(address.address3);
        expect(response.addressLine4).to.equal(address.address4);
        expect(response.town).to.equal(address.town);
        expect(response.county).to.equal(address.county);
        expect(response.country).to.equal(address.country);
        expect(response.postcode).to.equal(address.postcode);
        expect(response.isTest).to.equal(address.isTest);
        expect(response.source).to.equal(address.dataSource);
        expect(response.uprn).to.equal(address.uprn);
      });
    });

    experiment('when an unexpected error is thrown', () => {
      let err;
      beforeEach(async () => {
        err = new Error('oh no! This is most unexpected');
        addressService.createAddress.throws(err);
      });

      test('throws the error', async () => {
        try {
          await controller.postAddress(createRequest());
        } catch (error) {
          expect(error).to.equal(err);
        }
      });
    });
  });
});
