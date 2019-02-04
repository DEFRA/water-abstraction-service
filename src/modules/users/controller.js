const idmConnector = require('../../lib/connectors/idm');
const Boom = require('boom');
const { get } = require('lodash');
const crmEntitiesConnector = require('../../lib/connectors/crm/entities');
const crmDocumentsConnector = require('../../lib/connectors/crm/documents');

const mapUserStatus = user => {
  return {
    isLocked: parseInt(user.reset_required) === 1,
    isInternal: !get(user, 'role.scopes', []).includes('external'),
    lastLogin: user.last_login,
    userName: user.user_name
  };
};

const getCompanyLicences = (company, documentHeaders) => {
  const companyEntityId = company.entityId;
  return documentHeaders
    .filter(doc => doc.company_entity_id === companyEntityId)
    .map(doc => ({
      documentId: doc.document_id,
      licenceRef: doc.system_external_id,
      licenceHolder: get(doc, 'metadata.contacts[0].name', '')
    }));
};

const getCompanyOutstandingVerifications = (company, verifications) => {
  const companyEntityId = company.entityId;
  return verifications
    .filter(v => v.companyEntityId === companyEntityId)
    .map(v => ({
      code: v.code,
      dateCreated: v.dateCreated,
      licences: v.documents
    }));
};

const mapCompanies = (companies, verifications, documentHeaders) => {
  return companies.map(company => {
    return {
      name: company.name,
      userRoles: company.userRoles,
      outstandingVerifications: getCompanyOutstandingVerifications(company, verifications),
      registeredLicences: getCompanyLicences(company, documentHeaders)
    };
  });
};

const isInternalUser = user => get(user, 'role.scopes', []).includes('internal');

const getUserCompanyStatus = user => {
  const entityId = user.external_id;

  if (isInternalUser(user) || !entityId) {
    return Promise.resolve([[], [], []]);
  }

  return Promise.all([
    crmEntitiesConnector.getEntityCompanies(entityId),
    crmEntitiesConnector.getEntityVerifications(entityId),
    crmDocumentsConnector.findMany({ entity_id: entityId })
  ]);
};

const getStatus = async (request, h) => {
  const userResponse = await idmConnector.usersClient.findOne(request.params.id);

  if (get(userResponse, 'error.name') === 'NotFoundError') {
    return Boom.notFound('User not found');
  }

  return getUserCompanyStatus(userResponse.data).then(results => {
    const [companies, verifications, documentsHeaders] = results;

    return {
      data: {
        user: mapUserStatus(userResponse.data),
        companies: mapCompanies(
          get(companies, 'data.companies', []),
          get(verifications, 'data', []),
          get(documentsHeaders, 'data', [])
        )
      },
      error: null
    };
  });
};

module.exports = {
  getStatus
};
