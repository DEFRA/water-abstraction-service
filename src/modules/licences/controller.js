const Boom = require('boom');
const { get } = require('lodash');
const documentsClient = require('../../lib/connectors/crm/documents');
const { usersClient } = require('../../lib/connectors/idm');
const permitClient = require('../../lib/connectors/permit');
const logger = require('../../lib/logger');
const extractConditions = require('./lib/extractConditions');
const extractPoints = require('./lib/extractPoints');

const getDocumentHeader = async documentId => {
  const documentResponse = await documentsClient.findMany({
    document_id: documentId
  });
  return get(documentResponse, 'data[0]');
};

const getLicence = async documentId => {
  const documentHeader = await getDocumentHeader(documentId);

  if (!documentHeader) {
    return;
  }

  const licenceResponse = await permitClient.licences.findMany({
    licence_id: documentHeader.system_internal_id
  });

  return get(licenceResponse, 'data[0]');
};

const handleUnexpectedError = (error, documentId, functionName) => {
  if (parseInt(error.statusCode) === 404) {
    return Boom.notFound('Not found', error);
  }

  error.params = { documentId };
  error.context = {
    component: 'modules/licences/controller',
    action: functionName
  };
  logger.error('Failed to get licence data for document', error);
  return Boom.boomify(error);
};

const wrapData = data => ({
  error: null,
  data
});

/**
 * Coordinates finding a full licence from the permit repository
 * using the CRM document ID.
 */
const getLicenceByDocumentId = async (request, h) => {
  const { documentId } = request.params;

  try {
    const licence = await getLicence(documentId);

    if (licence) {
      return wrapData(licence);
    }
    return Boom.notFound();
  } catch (error) {
    return handleUnexpectedError(error, documentId, 'getLicenceByDocumentId');
  }
};

const getLicenceConditionsByDocumentId = async (request, h) => {
  const { documentId } = request.params;

  try {
    const licence = await getLicence(documentId);

    if (licence) {
      const currentVersion = get(licence, 'licence_data_value.data.current_version');
      return wrapData(extractConditions(currentVersion));
    }
    return Boom.notFound();
  } catch (error) {
    return handleUnexpectedError(error, documentId, 'getLicenceConditionsByDocumentId');
  }
};

const getLicencePointsByDocumentId = async (request, h) => {
  const { documentId } = request.params;

  try {
    const licence = await getLicence(documentId);

    if (licence) {
      const currentVersion = get(licence, 'licence_data_value.data.current_version');
      return wrapData(extractPoints(currentVersion));
    }
    return Boom.notFound();
  } catch (error) {
    return handleUnexpectedError(error, documentId, 'getLicencePointsByDocumentId');
  }
};

const getLicenceUsersByDocumentId = async (request, h) => {
  const { documentId } = request.params;

  try {
    const documentUsers = await documentsClient.getDocumentUsers(documentId);
    const userEntityIds = get(documentUsers, 'data', []).map(u => u.entityId);
    const { data: users } = await usersClient.getUsersByExternalId(userEntityIds);

    return {
      error: null,
      data: users.map(user => ({
        userId: user.user_id,
        entityId: user.external_id,
        userName: user.user_name,
        roles: documentUsers.data.find(d => d.entityId === user.external_id).roles
      }))
    };
  } catch (error) {
    return handleUnexpectedError(error, documentId, 'getLicenceUsersByDocumentId');
  }
};

module.exports = {
  getLicenceByDocumentId,
  getLicenceConditionsByDocumentId,
  getLicencePointsByDocumentId,
  getLicenceUsersByDocumentId
};
