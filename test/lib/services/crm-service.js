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

const crmService = require('../../../src/lib/services/crm-service');
const addressesConnector = require('../../../src/lib/connectors/crm-v2/addresses');
const companiesConnector = require('../../../src/lib/connectors/crm-v2/companies');

const Address = require('../../../src/lib/models/address');
const CompanyAddress = require('../../../src/lib/models/company-address');

experiment('lib/services/crm-service', () => {
  beforeEach(() => {
    sandbox.stub(addressesConnector, 'deleteAddress').resolves();
    sandbox.stub(companiesConnector, 'deleteCompanyAddress').resolves();
  });

  afterEach(() => sandbox.restore());

  experiment('.deleteEntities', () => {
    test('deletes entity when there is only one present', async () => {
      const address = new Address(uuid());
      await crmService.deleteEntities([address]);
      const [addressId] = addressesConnector.deleteAddress.lastCall.args;
      expect(addressId).to.equal(address.id);
    });

    test('calls the relevant services for each entity', async () => {
      const address = new Address(uuid());
      const companyAddress = new CompanyAddress(uuid());
      await crmService.deleteEntities([address, companyAddress]);
      const [addressId] = addressesConnector.deleteAddress.lastCall.args;
      const [, companyAddressId] = companiesConnector.deleteCompanyAddress.lastCall.args;
      expect(addressId).to.equal(address.id);
      expect(companyAddressId).to.equal(companyAddress.id);
    });
  });
});
