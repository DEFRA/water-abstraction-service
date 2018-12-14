const Boom = require('boom');
const { get } = require('lodash');
const documentsClient = require('../../lib/connectors/crm/documents');
const permitClient = require('../../lib/connectors/permit');
const logger = require('../../lib/logger');
const extractConditions = require('./lib/extractConditions');

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

const wrapData = data => ({
  error: null,
  data
});

const addErrorDetail = (error, documentId, functionName) => {
  error.params = { documentId };
  error.context = {
    component: 'modules/licences/controller',
    action: functionName
  };
  return error;
};

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
    addErrorDetail(error, documentId, 'getLicenceByDocumentId');
    logger.error('Failed to get licence data for document', error);
    return Boom.boomify(error);
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
    addErrorDetail(error, documentId, 'getLicenceConditionsByDocumentId');
    logger.error('Failed to get licence conditions data for document', error);
    return Boom.boomify(error);
  }
};

module.exports = {
  getLicenceByDocumentId,
  getLicenceConditionsByDocumentId
};
