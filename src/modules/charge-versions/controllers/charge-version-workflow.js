'use strict';

const Boom = require('@hapi/boom');

const chargeVersionsWorkflowService = require('../../../lib/services/charge-version-workflows');
const licencesService = require('../../../lib/services/licences');

const controller = require('../../../lib/controller');

const { rowToAPIList } = require('../mappers/api-mapper');

const mapErrorResponse = require('../../../lib/map-error-response');

/**
 * Get all charge version workflows in DB
 */
const getChargeVersionWorkflows = () =>
  controller.getEntities(null, chargeVersionsWorkflowService.getAllWithLicenceHolder, rowToAPIList);

/**
 * Get a specific charge version workflow by ID
 * @param {String} request.params.chargeVersionWorkflowId
 */
const getChargeVersionWorkflow = request =>
  controller.getEntity(request.params.chargeVersionWorkflowId, chargeVersionsWorkflowService.getByIdWithLicenceHolder);

/**
 * Creates a new charge version workflow record
 * @param {String} request.payload.licenceId - the licence for the new charge version
 * @param {ChargeVersion} request.pre.chargeVersion
 * @param {User} request.pre.user
 */
const postChargeVersionWorkflow = async request => {
  const { licenceId } = request.payload;
  const { chargeVersion, user } = request.pre;

  // Find licence or 404
  const licence = await licencesService.getLicenceById(licenceId);
  if (!licence) {
    return Boom.notFound(`Licence ${licenceId} not found`);
  }

  return chargeVersionsWorkflowService.create(licence, chargeVersion, user);
};

/**
 * Updates a charge version workflow record
 * @param {String} [request.payload.status]
 * @param {String} [request.payload.approverComments]
 * @param {Object} [request.payload.chargeVersion]
 */
const patchChargeVersionWorkflow = async (request, h) => {
  const { chargeVersionWorkflowId } = request.params;
  const { chargeVersion } = request.pre;

  const changes = {
    ...request.payload,
    ...chargeVersion && { chargeVersion }
  };

  try {
    const chargeVersionWorkflow = await chargeVersionsWorkflowService.update(chargeVersionWorkflowId, changes);
    return chargeVersionWorkflow;
  } catch (err) {
    return mapErrorResponse(err);
  }
};

const deleteChargeVersionWorkflow = (request, h) =>
  controller.deleteEntity(chargeVersionsWorkflowService.delete, h, request.params.chargeVersionWorkflowId);

exports.getChargeVersionWorkflows = getChargeVersionWorkflows;
exports.getChargeVersionWorkflow = getChargeVersionWorkflow;
exports.postChargeVersionWorkflow = postChargeVersionWorkflow;
exports.patchChargeVersionWorkflow = patchChargeVersionWorkflow;
exports.deleteChargeVersionWorkflow = deleteChargeVersionWorkflow;
