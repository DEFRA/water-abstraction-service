'use strict';

const Boom = require('@hapi/boom');

const controller = require('../../../lib/controller');
const documentsConnector = require('../../../lib/connectors/crm/documents');
const licencesService = require('../../../lib/services/licences');
const chargeElementsService = require('../../../lib/services/charge-elements');
const chargeVersionsService = require('../../../lib/services/charge-versions');

/**
 * Gets a charge version complete with its elements and agreements
 * @param  {String}  request.params.versionId - the charge version ID
 */
const getChargeVersion = async request =>
  controller.getEntity(
    request.params.versionId,
    chargeVersionsService.getByChargeVersionId
  );

const getChargeVersionsByDocumentId = async request => {
  const { documentId } = request.params;

  const { data: document } = await documentsConnector.getDocument(documentId, true);
  const chargeVersions = await chargeVersionsService.getByLicenceRef(document.system_external_id);

  return { data: chargeVersions };
};

const getDefaultChargesForLicenceVersion = async request => {
  const { licenceVersionId } = request.params;

  const licenceVersion = await licencesService.getLicenceVersionById(licenceVersionId);

  return licenceVersion === null
    ? Boom.notFound('No licence version found')
    : chargeElementsService.getChargeElementsFromLicenceVersion(licenceVersion);
};

exports.getChargeVersion = getChargeVersion;
exports.getChargeVersionsByDocumentId = getChargeVersionsByDocumentId;
exports.getDefaultChargesForLicenceVersion = getDefaultChargesForLicenceVersion;
