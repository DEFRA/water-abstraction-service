'use strict';

const { expect } = require('code');
const {
  beforeEach,
  afterEach,
  experiment,
  test } = exports.lab = require('lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('../../../src/modules/users/controller');
const idmConnector = require('../../../src/lib/connectors/idm');
const crmEntitiesConnector = require('../../../src/lib/connectors/crm/entities');
const crmDocumentsConnector = require('../../../src/lib/connectors/crm/documents');

const getUserResponse = () => ({
  error: null,
  data: {
    user_id: 2037,
    user_name: 'test@example.com',
    reset_required: '0',
    last_login: '2019-01-24T17:07:54.000Z',
    role: { scopes: [ 'external' ] },
    external_id: 'user-external-id'
  }
});

const getCompaniesResponse = () => ({
  data: {
    entityId: 'user_external_id',
    entityName: 'test@example.com',
    companies: [
      {
        userRoles: [ 'primary_user' ],
        entityId: 'wet_and_wild_id',
        name: 'Wet and Wild'
      },
      {
        userRoles: [ 'user', 'user_returns' ],
        entityId: 'max_irrigation_id',
        name: 'Max Irrigation'
      }
    ]
  },
  error: null
});

const getVerificationsResponse = () => ({
  data: [
    {
      id: 'verification_one_id',
      companyEntityId: 'wet_and_wild_id',
      code: 'test_code_1',
      dateCreated: '2017-01-01T00:00:00.000Z',
      documents: [
        { licenceRef: 'lic_1', documentId: 'lic_1_document_id' },
        { licenceRef: 'lic_2', documentId: 'lic_2_document_id' }
      ]
    },
    {
      id: 'verification_two_id',
      companyEntityId: 'max_irrigation_id',
      code: 'test_code_2',
      dateCreated: '2018-01-01T00:00:00.000Z',
      documents: [
        { licenceRef: 'lic_3', documentId: 'lic_3_document_id' }
      ]
    }
  ],
  error: null
});

const getDocumentHeaderResponse = () => ({
  data: [
    {
      document_id: 'lic_1_document_id',
      system_external_id: 'lic_1',
      metadata: {
        Name: 'Wet and Wild',
        contacts: [
          { name: 'Wet and Wild LH', 'role': 'Licence holder' },
          { name: 'Wet and Wild Other', 'role': 'other role' }
        ]
      },
      company_entity_id: 'wet_and_wild_id'
    },
    {
      document_id: 'lic_2_document_id',
      system_external_id: 'lic_2',
      metadata: {
        Name: 'Wet and Wild',
        contacts: [
          { name: 'Wet and Wild LH', 'role': 'Licence holder' },
          { name: 'Wet and Wild Other', 'role': 'other role' }
        ]
      },
      company_entity_id: 'wet_and_wild_id'
    },
    {
      document_id: 'lic_3_document_id',
      system_external_id: 'lic_3',
      metadata: {
        Name: 'Max Irrigation',
        contacts: [
          { name: 'Max Irrigation LH', 'role': 'Licence holder' },
          { name: 'Max Irrigation Other', 'role': 'other role' }
        ]
      },
      company_entity_id: 'max_irrigation_id'
    }
  ],
  error: null
});

experiment('getStatus', () => {
  beforeEach(async () => {
    sandbox.stub(idmConnector.usersClient, 'findOne').resolves(getUserResponse());
    sandbox.stub(crmEntitiesConnector, 'getEntityCompanies').resolves(getCompaniesResponse());
    sandbox.stub(crmEntitiesConnector, 'getEntityVerifications').resolves(getVerificationsResponse());
    sandbox.stub(crmDocumentsConnector, 'findMany').resolves(getDocumentHeaderResponse());
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected user id to the idm connector', async () => {
    const request = { params: { id: 123 } };
    await controller.getStatus(request);
    const idmArgs = idmConnector.usersClient.findOne.args[0][0];
    expect(idmArgs).to.equal(123);
  });

  test('format user section as required', async () => {
    const request = { params: { id: 123 } };
    const response = await controller.getStatus(request);
    const user = response.data.user;
    expect(user).to.equal({
      isLocked: false,
      isInternal: false,
      lastLogin: '2019-01-24T17:07:54.000Z',
      userName: 'test@example.com'
    });
  });

  test('identifies a locked account', async () => {
    const request = { params: { id: 123 } };
    const testResponse = getUserResponse();
    testResponse.data.reset_required = 1;
    idmConnector.usersClient.findOne.resolves(testResponse);

    const response = await controller.getStatus(request);
    const user = response.data.user;

    expect(user).to.equal({
      isLocked: true,
      isInternal: false,
      lastLogin: '2019-01-24T17:07:54.000Z',
      userName: 'test@example.com'
    });
  });

  test('identifies an internal user', async () => {
    const request = { params: { id: 123 } };
    const testResponse = getUserResponse();
    testResponse.data.role.scopes = ['internal'];
    idmConnector.usersClient.findOne.resolves(testResponse);

    const response = await controller.getStatus(request);
    const user = response.data.user;

    expect(user).to.equal({
      isLocked: false,
      isInternal: true,
      lastLogin: '2019-01-24T17:07:54.000Z',
      userName: 'test@example.com'
    });

    expect(response.data.companies).to.equal([]);
  });

  test('passes the user entity id to the getEntitiesCompanies function', async () => {
    const request = { params: { id: 123 } };
    await controller.getStatus(request);
    const getCompaniesArgs = crmEntitiesConnector.getEntityCompanies.args[0][0];
    expect(getCompaniesArgs).to.equal(getUserResponse().data.external_id);
  });

  test('includes all the associated companies', async () => {
    const request = { params: { id: 123 } };

    const response = await controller.getStatus(request);
    const companies = response.data.companies;
    expect(companies.length).to.equal(2);
  });

  test('the companies contain thier names', async () => {
    const request = { params: { id: 123 } };

    const response = await controller.getStatus(request);

    const companies = response.data.companies;
    expect(companies.find(c => c.name === 'Wet and Wild')).to.exist();
    expect(companies.find(c => c.name === 'Max Irrigation')).to.exist();
  });

  test('the companies contain the user roles at the company', async () => {
    const request = { params: { id: 123 } };

    const response = await controller.getStatus(request);

    const companies = response.data.companies;
    expect(companies.find(c => c.name === 'Wet and Wild').userRoles)
      .to
      .only
      .include(['primary_user']);

    expect(companies.find(c => c.name === 'Max Irrigation').userRoles)
      .to
      .only
      .include(['user', 'user_returns']);
  });

  test('the companies contain thier outstanding verifications', async () => {
    const request = { params: { id: 123 } };

    const response = await controller.getStatus(request);

    const companies = response.data.companies;
    expect(companies.find(c => c.name === 'Wet and Wild').outstandingVerifications)
      .to.equal([
        {
          code: 'test_code_1',
          dateCreated: '2017-01-01T00:00:00.000Z',
          licences: [
            { licenceRef: 'lic_1', documentId: 'lic_1_document_id' },
            { licenceRef: 'lic_2', documentId: 'lic_2_document_id' }
          ]
        }
      ]);

    expect(companies.find(c => c.name === 'Max Irrigation').outstandingVerifications)
      .to.equal([
        {
          code: 'test_code_2',
          dateCreated: '2018-01-01T00:00:00.000Z',
          licences: [{ licenceRef: 'lic_3', documentId: 'lic_3_document_id' }]
        }
      ]);
  });

  test('uses the user entity id to fetch documents', async () => {
    const request = { params: { id: 123 } };
    await controller.getStatus(request);
    const getDocumentsArgs = crmDocumentsConnector.findMany.args[0][0];
    expect(getDocumentsArgs).to.equal({
      entity_id: getUserResponse().data.external_id
    });
  });

  test('adds the licence summary to each company', async () => {
    const request = { params: { id: 123 } };
    const response = await controller.getStatus(request);

    const companies = response.data.companies;
    expect(companies.find(c => c.name === 'Wet and Wild').registeredLicences)
      .to.equal([
        {
          documentId: 'lic_1_document_id',
          licenceRef: 'lic_1',
          licenceHolder: 'Wet and Wild LH'
        },
        {
          documentId: 'lic_2_document_id',
          licenceRef: 'lic_2',
          licenceHolder: 'Wet and Wild LH'
        }
      ]);

    expect(companies.find(c => c.name === 'Max Irrigation').registeredLicences)
      .to.equal([
        {
          documentId: 'lic_3_document_id',
          licenceRef: 'lic_3',
          licenceHolder: 'Max Irrigation LH'
        }
      ]);
  });

  test('when no user is found a 404 is returned', async () => {
    const request = { params: { id: 123 } };
    idmConnector.usersClient.findOne.resolves({
      error: {
        name: 'NotFoundError'
      }
    });

    const response = await controller.getStatus(request);

    expect(response.output.statusCode).to.equal(404);
    expect(response.output.payload.message).to.equal('User not found');
  });

  test('only returns the user part when no external/enitity id is present', async () => {
    const request = { params: { id: 123 } };
    const testResponse = getUserResponse();
    testResponse.data.external_id = null;
    idmConnector.usersClient.findOne.resolves(testResponse);

    const response = await controller.getStatus(request);
    const user = response.data.user;

    expect(user).to.equal({
      isLocked: false,
      isInternal: false,
      lastLogin: '2019-01-24T17:07:54.000Z',
      userName: 'test@example.com'
    });

    expect(response.data.companies).to.equal([]);
  });
});
