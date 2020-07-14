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

const Company = require('../../../src/lib/models/company');
const CompanyAddress = require('../../../src/lib/models/company-address');
const CompanyContact = require('../../../src/lib/models/company-contact');
const companiesService = require('../../../src/lib/services/companies-service');
const companiesConnector = require('../../../src/lib/connectors/crm-v2/companies');
const mappers = require('../../../src/lib/mappers');
const { NotFoundError } = require('../../../src/lib/errors');

const TEST_GUID = uuid();

experiment('modules/billing/services/companies-service', () => {
  beforeEach(() => {

  });
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getCompany', () => {
    let companyId, companyData, companyModel, response;
    beforeEach(async () => {
      companyId = TEST_GUID;
      companyData = {
        companyId,
        name: 'company name',
        type: 'organisation'
      };
      companyModel = new Company(TEST_GUID);

      sandbox.stub(companiesConnector, 'getCompany').resolves(companyData);
      sandbox.stub(mappers.company, 'crmToModel').returns(companyModel);

      response = await companiesService.getCompany(companyId);
    });

    test('calls the companies connector with the company id', () => {
      expect(companiesConnector.getCompany.calledWith(
        companyId
      )).to.be.true();
    });

    test('calls the mapper with the company data returned from crm', () => {
      expect(mappers.company.crmToModel.calledWith(
        companyData
      )).to.be.true();
    });

    test('returns the output of the company mapper', () => {
      expect(response).to.equal(companyModel);
    });

    test('if company does not exist, throws a NotFoundError', async () => {
      companiesConnector.getCompany.resolves(null);
      try {
        response = await companiesService.getCompany(companyId);
      } catch (err) {
        expect(err).to.be.instanceOf(NotFoundError);
        expect(err.message).to.equal(`Company ${companyId} not found`);
      }
    });
  });

  experiment('.getCompanyAddresses', () => {
    let companyId, companyAddressData, companyAddressModel, response;
    beforeEach(async () => {
      companyId = TEST_GUID;
      companyAddressData = [{
        companyAddressId: uuid(),
        startDate: '2020-04-01',
        endDate: null
      }];
      companyAddressModel = new CompanyAddress(TEST_GUID);

      sandbox.stub(companiesConnector, 'getCompanyAddresses').resolves(companyAddressData);
      sandbox.stub(mappers.companyAddress, 'crmToModel').returns(companyAddressModel);

      response = await companiesService.getCompanyAddresses(companyId);
    });

    test('calls the companies connector with the company id', () => {
      expect(companiesConnector.getCompanyAddresses.calledWith(
        companyId
      )).to.be.true();
    });

    test('calls the mapper with the company data returned from crm', () => {
      expect(mappers.companyAddress.crmToModel.calledWith(
        companyAddressData[0]
      )).to.be.true();
    });

    test('returns the output of the company mapper', () => {
      expect(response).to.equal([companyAddressModel]);
    });
  });

  experiment('.createCompany', () => {
    let companyData, mappedData, newCompany, companyModel, response;
    beforeEach(async () => {
      companyData = {
        name: 'company name',
        type: 'limitedCompany'
      };
      mappedData = {
        name: 'company name',
        type: 'organisation',
        organisationType: 'limitedCompany'
      };
      newCompany = {
        companyId: TEST_GUID,
        name: 'company name',
        type: 'organisation',
        organisationType: 'limitedCompany'
      };
      companyModel = new Company(TEST_GUID);

      sandbox.stub(companiesConnector, 'createCompany').resolves(newCompany);
      sandbox.stub(mappers.company, 'serviceToCrm').returns(mappedData);
      sandbox.stub(mappers.company, 'crmToModel').returns(companyModel);

      response = await companiesService.createCompany(companyData);
    });
    test('calls the company mapper to map data for the DB call', async () => {
      const [passedData] = mappers.company.serviceToCrm.lastCall.args;
      expect(passedData).to.equal(companyData);
    });

    test('calls the companies connector with the mapped data', async () => {
      const [companyData] = companiesConnector.createCompany.lastCall.args;
      expect(companyData).to.equal(mappedData);
    });

    test('calls the crm to model mapper with the output of the crm call', async () => {
      const [companyData] = mappers.company.crmToModel.lastCall.args;
      expect(companyData).to.equal(newCompany);
    });

    test('returns the output from the mapper', async () => {
      expect(response).to.equal(companyModel);
    });
  });

  experiment('.createCompanyAddress', () => {
    let companyId, companyAddressData, newCompanyAddress, companyAddressModel, response;
    beforeEach(async () => {
      companyId = uuid();
      companyAddressData = {
        address: { addressId: uuid() },
        startDate: '2020-04-01',
        endDate: null
      };
      newCompanyAddress = {
        companyAddressId: TEST_GUID
      };
      companyAddressModel = new CompanyAddress(TEST_GUID);

      sandbox.stub(companiesConnector, 'createCompanyAddress').resolves(newCompanyAddress);
      sandbox.stub(mappers.companyAddress, 'crmToModel').returns(companyAddressModel);

      response = await companiesService.createCompanyAddress(companyId, companyAddressData);
    });

    test('calls the companies address connector with the mapped data', async () => {
      const [id, companyAddressData] = companiesConnector.createCompanyAddress.lastCall.args;
      expect(id).to.equal(companyId);
      expect(companyAddressData).to.equal(companyAddressData);
    });

    test('calls the crm to model mapper with the output of the crm call', async () => {
      const [companyAddressData] = mappers.companyAddress.crmToModel.lastCall.args;
      expect(companyAddressData).to.equal(newCompanyAddress);
    });

    test('returns the output from the mapper', async () => {
      expect(response).to.equal(companyAddressModel);
    });
  });

  experiment('.createCompanyContact', () => {
    let companyId, companyContactData, newCompanyContact, companyContactModel, response;
    beforeEach(async () => {
      companyId = uuid();
      companyContactData = {
        firstName: 'Bob',
        lastName: 'Jones',
        type: 'licenceHolder'
      };
      newCompanyContact = {
        companyContactId: TEST_GUID,
        firstName: 'Bob',
        lastName: 'Jones',
        type: 'licenceHolder'
      };
      companyContactModel = new CompanyContact(TEST_GUID);

      sandbox.stub(companiesConnector, 'createCompanyContact').resolves(newCompanyContact);
      sandbox.stub(mappers.companyContact, 'crmToModel').returns(companyContactModel);

      response = await companiesService.createCompanyContact(companyId, companyContactData);
    });

    test('calls the companies address connector with the mapped data', async () => {
      const [id, companyContactData] = companiesConnector.createCompanyContact.lastCall.args;
      expect(id).to.equal(companyId);
      expect(companyContactData).to.equal(companyContactData);
    });

    test('calls the crm to model mapper with the output of the crm call', async () => {
      const [companyContactData] = mappers.companyContact.crmToModel.lastCall.args;
      expect(companyContactData).to.equal(newCompanyContact);
    });

    test('returns the output from the mapper', async () => {
      expect(response).to.equal(companyContactModel);
    });
  });
});
