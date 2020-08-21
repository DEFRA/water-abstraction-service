'use strict';

const Boom = require('@hapi/boom');

const chargeVersionsWorkflowService = require('../services/charge-version-workflows');
const licencesService = require('../../../lib/services/licences');
const chargeVersionMapper = require('../../../lib/mappers/charge-version');

const controller = require('../../../lib/controller');
const userMapper = require('../../../lib/mappers/user');

/**
 * Gets a list of charge version workflows
 * These are objects being worked on that will be used to generate
 * charge versions when approved
 */
const getChargeVersionWorkflows = () =>
  controller.getEntities(null, chargeVersionsWorkflowService.getAll);

/**
 * Creates a new charge version workflow record
 * @param {Object} request.defra.internalCallingUser - the user creating the record
 * @param {String} request.payload.licenceId - the licence for the new charge version
 * @param {Object} request.payload.chargeVersion - the charge version data
 */
const postChargeVersionWorkflow = async (request, h) => {
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
exports.postChargeVersionWorkflow = postChargeVersionWorkflow;
