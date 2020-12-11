const entityConnector = require('../../../lib/connectors/crm/entities');
const companiesConnector = require('../../../lib/connectors/crm-v2/companies');
const documentsConnector = require('../../../lib/connectors/crm-v2/documents');
const addressConnector = require('../../../lib/connectors/crm-v2/addresses');
const { ACCEPTANCE_TEST_SOURCE, TEST_COMPANY_NAME } = require('./constants');

const createIndividual = email => createEntity(email, 'individual');

const createV1Company = () => createEntity(TEST_COMPANY_NAME, 'company');

const createV2Company = (name = TEST_COMPANY_NAME, type = 'organisation') => companiesConnector.createCompany({
  name: name,
  type: type,
  isTest: true
});

const createV2Address = () => addressConnector.createAddress({
  address1: 'Test Address Line 1',
  address2: 'Test Address Line 2',
  address3: 'Test Address Line 3',
  address4: 'Test Address Line 4',
  town: 'SomeCity',
  country: 'Lebanon',
  isTest: true,
  dataSource: 'wrls'
});

const createV2CompanyRole = (documentId, roleObject) => {
  documentsConnector.createDocumentRole(documentId, roleObject);
};

const createEntity = (name, type) => entityConnector.createEntity(
  name,
  type,
  ACCEPTANCE_TEST_SOURCE
);

const createEntityRole = (entityId, companyId, role = 'primary_user') => {
  return entityConnector.createEntityRole(entityId, role, ACCEPTANCE_TEST_SOURCE, companyId);
};

exports.createIndividual = createIndividual;
exports.createV1Company = createV1Company;
exports.createV2Company = createV2Company;
exports.createV2CompanyRole = createV2CompanyRole;
exports.createV2Address = createV2Address;
exports.createEntityRole = createEntityRole;
exports.delete = () => entityConnector.deleteAcceptanceTestData();
