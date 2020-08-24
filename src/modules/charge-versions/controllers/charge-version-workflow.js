'use strict';

const Boom = require('@hapi/boom');

const chargeVersionsWorkflowService = require('../services/charge-version-workflows');
const licencesService = require('../../../lib/services/licences');
const chargeVersionMapper = require('../../../lib/mappers/charge-version');

const controller = require('../../../lib/controller');
const userMapper = require('../../../lib/mappers/user');

const { rowToAPIList } = require('../mappers/api-mapper');

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
 * @param {Object} request.defra.internalCallingUser - the user creating the record
 * @param {String} request.payload.licenceId - the licence for the new charge version
 * @param {Object} request.payload.chargeVersion - the charge version data
 */
const postChargeVersionWorkflow = async request => {
  const { internalCallingUser } = request.defra;
  const { licenceId, chargeVersion } = request.payload;

  const entities = {};

  // Find licence or 404
  entities.licence = await licencesService.getLicenceById(licenceId);
  if (!entities.licence) {
    return Boom.notFound(`Licence ${licenceId} not found`);
  }

  // Map user or 422
  try {
    entities.user = userMapper.pojoToModel(internalCallingUser);
  } catch (err) {
    return Boom.badData('Invalid user data');
  }

  // Map charge version or 422
  try {
    entities.chargeVersion = chargeVersionMapper.pojoToModel(chargeVersion);
  } catch (err) {
    return Boom.badData('Invalid charge version data');
  }

  return chargeVersionsWorkflowService.create(entities.licence, entities.chargeVersion, entities.user);
};

exports.getChargeVersionWorkflows = getChargeVersionWorkflows;
exports.getChargeVersionWorkflow = getChargeVersionWorkflow;
exports.postChargeVersionWorkflow = postChargeVersionWorkflow;
