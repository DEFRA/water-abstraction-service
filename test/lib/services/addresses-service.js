const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const uuid = require('uuid/v4');
const addressesService = require('../../../src/lib/services/addresses-service');
const addressesConnector = require('../../../src/lib/connectors/crm-v2/addresses');
const addressMapper = require('../../../src/lib/mappers/address');
const Address = require('../../../src/lib/models/address');
const { InvalidEntityError } = require('../../../src/lib/errors');

const addressId = uuid();

experiment('modules/billing/services/addresses-service', () => {
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getAddressModel', () => {
    let addressData, addressModel, response;
    beforeEach(() => {
      sandbox.stub(addressMapper, 'uiToModel');
    });
    experiment('when only an address id is provided', () => {
      beforeEach(async () => {
        addressData = {
          addressId
        };
        addressModel = new Address(addressId);
        addressMapper.uiToModel.returns(addressModel);
        response = await addressesService.getAddressModel(addressData);
      });
      test('calls the address mapper to map data from the ui', async () => {
        const [passedData] = addressMapper.uiToModel.lastCall.args;
        expect(passedData).to.equal(addressData);
      });

      test('returns the output from the mapper', async () => {
        expect(response).to.equal(addressModel);
      });
    });

    experiment('when new address data is provided', () => {
      beforeEach(async () => {
        addressData = {
          addressLine2: '742',
          addressLine3: 'Evergreen Terrace',
          town: 'Springfield',
          country: 'USA'
        };
        addressModel = new Address();
        addressModel.fromHash(addressData);
        addressMapper.uiToModel.returns(addressModel);

        response = await addressesService.getAddressModel(addressData);
      });
      test('calls the address mapper to map data from the ui', async () => {
        const [passedData] = addressMapper.uiToModel.lastCall.args;
        expect(passedData).to.equal(addressData);
      });

      test('returns the output from the mapper', async () => {
        expect(response).to.equal(addressModel);
      });

      test('throws an invalid entity error when the address data is invalid', async () => {
        addressData = {
          addressLine2: '742',
          addressLine3: 'Evergreen Terrace',
          town: 'Springfield'
        };
        addressModel = new Address();
        addressModel.fromHash(addressData);
        addressMapper.uiToModel.returns(addressModel);

        try {
          await addressesService.getAddressModel(addressData);
        } catch (err) {
          expect(err).to.be.instanceOf(InvalidEntityError);
          expect(err.message).to.equal('Invalid address');
        }
      });
    });
  });

  experiment('.createAddress', () => {
    let addressData, mappedData, newAddress, addressModel, response;
    beforeEach(async () => {
      addressData = {
        addressLine2: '742',
        addressLine3: 'Evergreen Terrace',
        town: 'Springfield',
        country: 'Simpsons Land'
      };
      mappedData = {
        address2: '742',
        address3: 'Evergreen Terrace',
        town: 'Springfield',
        country: 'Simpsons Land'
      };
      newAddress = {
        addressId: addressId,
        address2: '742',
        address3: 'Evergreen Terrace',
        town: 'Springfield',
        country: 'Simpsons Land'
      };
      addressModel = new Address(addressId);
      sandbox.stub(addressMapper, 'modelToCrm').returns(mappedData);
      sandbox.stub(addressMapper, 'crmToModel').resolves(addressModel);

      sandbox.stub(addressesConnector, 'createAddress').resolves(newAddress);

      response = await addressesService.createAddress(addressData);
    });
    test('calls the address mapper to map data for the DB call', async () => {
      const [passedData] = addressMapper.modelToCrm.lastCall.args;
      expect(passedData).to.equal(addressData);
    });

    test('calls the address connector with the mapped data', async () => {
      const [addressData] = addressesConnector.createAddress.lastCall.args;
      expect(addressData).to.equal(mappedData);
    });

    test('calls the crm to model mapper with the output of the crm call', async () => {
      const [addressData] = addressMapper.crmToModel.lastCall.args;
      expect(addressData).to.equal(newAddress);
    });

    test('returns the output from the mapper', async () => {
      expect(response).to.equal(addressModel);
    });
  });

  experiment('.deleteAddress', () => {
    beforeEach(async () => {
      sandbox.stub(addressesConnector, 'deleteAddress').resolves();

      await addressesService.deleteAddress({ id: 'test-address-id' });
    });

    test('the id is passed to the connector', () => {
      const [passedId] = addressesConnector.deleteAddress.lastCall.args;
      expect(passedId).to.equal('test-address-id');
    });
  });
});
