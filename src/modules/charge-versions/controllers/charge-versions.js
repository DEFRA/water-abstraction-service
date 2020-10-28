'use strict';

const Boom = require('@hapi/boom');

const controller = require('../../../lib/controller');
const documentsConnector = require('../../../lib/connectors/crm/documents');
const licencesService = require('../../../lib/services/licences');
const chargeElementsService = require('../../../lib/services/charge-elements');
const chargeVersionsService = require('../../../lib/services/charge-versions');
const chargeVersionWorkflowService = require('../services/charge-version-workflows');
const mapErrorResponse = require('../../../lib/map-error-response');

const userMapper = require('../../../lib/mappers/user');

const { logger } = require('../../../logger');

/**
 * Gets a charge version complete with its elements and agreements
 * @param  {String}  request.params.versionId - the charge version ID
 */
const getChargeVersion = async request =>
  controller.getEntity(
    request.params.versionId,
    chargeVersionsService.getByIdWithInvoiceAccount
  );

const getChargeVersionsByDocumentId = async request => {
  const { documentId } = request.params;

  const { data: document } = await documentsConnector.getDocument(documentId, true);
  const chargeVersions = await chargeVersionsService.getByLicenceRef(document.system_external_id);

  return { data: chargeVersions };
};

const getChargeVersionsByLicenceId = async request => {
  const { licenceId } = request.params;
  const chargeVersions = await chargeVersionsService.getByLicenceId(licenceId);
  return { data: chargeVersions };
};

/**
 * Gets the default expected charge elements based on abstraction data
 * for the specified licence version
 * @param {String} request.params.licenceVersionId
 */
const getDefaultChargesForLicenceVersion = async request => {
  const { licenceVersionId } = request.params;

  const licenceVersion = await licencesService.getLicenceVersionById(licenceVersionId);

  return licenceVersion === null
    ? Boom.notFound('No licence version found')
    : chargeElementsService.getChargeElementsFromLicenceVersion(licenceVersion);
};

/**
 * Create a charge version from the specified workflow
 * @param {String} request.params.chargeVersionWorkflowId
 */
const postCreateFromWorkflow = async request => {
  const { chargeVersionWorkflowId } = request.params;
  try {
    const chargeVersionWorkflow = await chargeVersionWorkflowService.getById(chargeVersionWorkflowId);

    if (!chargeVersionWorkflow) {
      return Boom.notFound(`Charge version workflow ${chargeVersionWorkflowId} not found`);
    }

    const approvedBy = userMapper.pojoToModel(request.defra.internalCallingUser);

    return chargeVersionWorkflowService.approve(chargeVersionWorkflow, approvedBy);
  } catch (err) {
    logger.error(`Error creating charge version from workflow ${chargeVersionWorkflowId}`, err);
    return mapErrorResponse(err);
  }
};

exports.getChargeVersion = getChargeVersion;
exports.getChargeVersionsByDocumentId = getChargeVersionsByDocumentId;
exports.getDefaultChargesForLicenceVersion = getDefaultChargesForLicenceVersion;
exports.postCreateFromWorkflow = postCreateFromWorkflow;
exports.getChargeVersionsByLicenceId = getChargeVersionsByLicenceId;
