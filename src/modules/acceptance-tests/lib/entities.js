const entityConnector = require('../../../lib/connectors/crm/entities');
const { ACCEPTANCE_TEST_SOURCE, TEST_COMPANY_NAME } = require('./constants');

const createIndividual = email => createEntity(email, 'individual');

const createCompany = () => createEntity(TEST_COMPANY_NAME, 'company');

const createEntity = (name, type) => entityConnector.createEntity(
  name,
  type,
  ACCEPTANCE_TEST_SOURCE
);

const createEntityRole = (entityId, companyId, role = 'primary_user') => {
  return entityConnector.createEntityRole(entityId, role, ACCEPTANCE_TEST_SOURCE, companyId);
};

exports.createIndividual = createIndividual;
exports.createCompany = createCompany;
exports.createEntityRole = createEntityRole;
exports.delete = () => entityConnector.deleteAcceptanceTestData();
