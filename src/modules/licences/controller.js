const Boom = require('boom');
const { get } = require('lodash');
const documentsClient = require('../../lib/connectors/crm/documents');
const permitClient = require('../../lib/connectors/permit');
const logger = require('../../lib/logger');

const getDocument = async documentId => {
  const documentResponse = await documentsClient.findMany({
    document_id: documentId
  });
  return get(documentResponse, 'data[0]');
};

const getLicence = async licenceId => {
  const licenceResponse = await permitClient.licences.findMany({
    licence_id: licenceId
  });
  return get(licenceResponse, 'data[0]');
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
    const documentHeader = await getDocument(documentId);

    if (documentHeader) {
      const licence = await getLicence(documentHeader.system_internal_id);

      if (licence) {
        return wrapData(licence);
      }
    }

    return Boom.notFound();
  } catch (error) {
    error.params = { documentId };
    error.context = {
      component: 'modules/licences/controller',
      action: 'getLicenceByDocumentId'
    };
    logger.error('Failed to get licence data for document', error);
    return Boom.boomify(error);
  }
};

module.exports = {
  getLicenceByDocumentId
};
