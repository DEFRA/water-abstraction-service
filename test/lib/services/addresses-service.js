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

const addressId = uuid();

experiment('modules/billing/services/addresses-service', () => {
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
    sandbox.stub(addressMapper, 'serviceToCrm').returns(mappedData);
    sandbox.stub(addressMapper, 'crmToModel').resolves(addressModel);

    sandbox.stub(addressesConnector, 'createAddress').resolves(newAddress);

    response = await addressesService.createAddress(addressData);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createAddress', () => {
    test('calls the address mapper to map data for the DB call', async () => {
      const [passedData] = addressMapper.serviceToCrm.lastCall.args;
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
});
