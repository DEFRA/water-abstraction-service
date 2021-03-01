'use strict';

const Boom = require('@hapi/boom');

const chargeVersionsWorkflowService = require('../services/charge-version-workflows');
const licencesService = require('../../../lib/services/licences');

const controller = require('../../../lib/controller');

const mapErrorResponse = require('../../../lib/map-error-response');

/**
 * Gets all charge version workflow or
 * those for the given licence id
 * @param {String} request.query.licenceId
 */
const getChargeVersionWorkflows = async request => {
  const { licenceId } = request.query;
  if (licenceId) {
    return { data: await chargeVersionsWorkflowService.getManyByLicenceId(licenceId) };
  } else {
    return chargeVersionsWorkflowService.getAllWithLicenceHolder();
  }
};

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
  const { chargeVersion, user, licenceVersion } = request.pre;

  chargeVersion.status = 'draft';

  // Find licence or 404
  const licence = await licencesService.getLicenceById(licenceId);
  if (!licence) {
    return Boom.notFound(`Licence ${licenceId} not found`);
  }

  return chargeVersionsWorkflowService.create(licence, licenceVersion.licenceVersionId, chargeVersion, user);
};

/**
 * Updates a charge version workflow record
 * @param {String} [request.payload.status]
 * @param {String} [request.payload.approverComments]
 * @param {Object} [request.payload.chargeVersion]
 */
const patchChargeVersionWorkflow = async (request, h) => {
  const { chargeVersionWorkflowId } = request.params;
  const { approverComments, status } = request.payload;
  const { chargeVersion } = request.pre;

  const changes = {
    ...request.payload,
    ...chargeVersion && { chargeVersion }
  };

  try {
    if (status === 'changes_requested') {
      const chargeVersionWorkflow = await chargeVersionsWorkflowService.update(chargeVersionWorkflowId, { approverComments, status });
      return chargeVersionWorkflow;
    } else {
      const chargeVersionWorkflow = await chargeVersionsWorkflowService.update(chargeVersionWorkflowId, changes);
      return chargeVersionWorkflow;
    }
  } catch (err) {
    return mapErrorResponse(err);
  }
};

const deleteChargeVersionWorkflow = async (request, h) => {
  const { chargeVersionWorkflow } = request.pre;
  try {
    await chargeVersionsWorkflowService.delete(chargeVersionWorkflow);
    return h.response().code(204);
  } catch (err) {
    return mapErrorResponse(err);
  }
};

exports.getChargeVersionWorkflows = getChargeVersionWorkflows;
exports.getChargeVersionWorkflow = getChargeVersionWorkflow;
exports.postChargeVersionWorkflow = postChargeVersionWorkflow;
exports.patchChargeVersionWorkflow = patchChargeVersionWorkflow;
exports.deleteChargeVersionWorkflow = deleteChargeVersionWorkflow;
