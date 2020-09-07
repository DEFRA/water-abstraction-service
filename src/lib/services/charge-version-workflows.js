'use strict';

const bluebird = require('bluebird');

// Services
const service = require('./service');
const documentsService = require('./documents-service');
const chargeVersionService = require('./charge-versions');

// Repos
const chargeVersionWorkflowsRepo = require('../connectors/repos/charge-version-workflows');

// Mappers
const chargeVersionWorkflowMapper = require('../mappers/charge-version-workflow');

// Models
const validators = require('../models/validators');
const ChargeVersionWorkflow = require('../models/charge-version-workflow');
const { CHARGE_VERSION_WORKFLOW_STATUS } = require('../models/charge-version-workflow');
const ChargeVersion = require('../models/charge-version');
const User = require('../models/user');
const Licence = require('../models/licence');
const Role = require('../models/role');
const { NotFoundError, InvalidEntityError } = require('../errors');
const { logger } = require('../../logger');

/**
 * Gets all charge version workflows from the DB
 * @return {Promise<Array>}
 */
const getAll = () => service.findAll(chargeVersionWorkflowsRepo.findAll, chargeVersionWorkflowMapper);

/**
 * Gets the licence-holder role for the supplied ChargeVersionWorkflow model
 * This is based on the licence number, and the start date of the charge
 * version
 * @param {ChargeVersionWorkflow} chargeVersionWorkflow
 * @return {Promise<Role>}
 */
const getLicenceHolderRole = async chargeVersionWorkflow => {
  const { licenceNumber } = chargeVersionWorkflow.licence;
  const { startDate } = chargeVersionWorkflow.chargeVersion.dateRange;
  const doc = await documentsService.getValidDocumentOnDate(licenceNumber, startDate);
  return {
    chargeVersionWorkflow,
    licenceHolderRole: doc.getRoleOnDate(Role.ROLE_NAMES.licenceHolder, startDate)
  };
};

/**
 * Gets all charge version workflows from the DB, including the
 * licence holder role
 * @return {Promise<Array>}
 */
const getAllWithLicenceHolder = async () => {
  const chargeVersionWorkflows = await getAll();
  return bluebird.map(chargeVersionWorkflows, getLicenceHolderRole);
};

/**
 * Gets a single charge version workflow by ID
 * @param {String} id
 */
const getById = id => service.findOne(id, chargeVersionWorkflowsRepo.findOne, chargeVersionWorkflowMapper);

/**
 * Gets a single charge version workflow by ID
 * with the licence holder
 * @param {String} id
 */
const getByIdWithLicenceHolder = async id => {
  const chargeVersionWorkflow = await getById(id);
  return chargeVersionWorkflow && getLicenceHolderRole(chargeVersionWorkflow);
};

/**
 * Updates the properties on the model - if any errors,
 * an InvalidEntityError is thrown
 * @param {ChargeVersionWorkflow} chargeVersionWorkflow
 * @param {Object} changes - a hash of properties to update
 */
const setOrThrowInvalidEntityError = (chargeVersionWorkflow, changes) => {
  try {
    return chargeVersionWorkflow.fromHash(changes);
  } catch (err) {
    logger.error(err);
    throw new InvalidEntityError(`Invalid data for charge version worklow ${chargeVersionWorkflow.id}`);
  }
};

/**
 * Create a new charge version workflow record
 * @param {Licence} licence
 * @param {ChargeVersion} chargeVersion
 * @param {User} user
 * @return {Promise<ChargeVersionWorkflow>}
 */
const create = async (licence, chargeVersion, user) => {
  validators.assertIsInstanceOf(licence, Licence);
  validators.assertIsInstanceOf(chargeVersion, ChargeVersion);
  validators.assertIsInstanceOf(user, User);

  // Map all data to ChargeVersionWorkflow model
  const chargeVersionWorkflow = new ChargeVersionWorkflow();

  setOrThrowInvalidEntityError(chargeVersionWorkflow, {
    createdBy: user,
    licence: licence,
    chargeVersion,
    status: CHARGE_VERSION_WORKFLOW_STATUS.draft
  });

  const dbRow = chargeVersionWorkflowMapper.modelToDb(chargeVersionWorkflow);
  const updated = await chargeVersionWorkflowsRepo.create(dbRow);
  return chargeVersionWorkflowMapper.dbToModel(updated);
};

/**
 * Updates a ChargeVersionWorkflow model
 * @param {String} chargeVersionWorkflowId
 * @param {Object} changes
 * @return {Promise<ChargeVersionWorkflow} - updated service model
 */
const update = async (chargeVersionWorkflowId, changes) => {
  // Load existing model
  const model = await getById(chargeVersionWorkflowId);
  if (!model) {
    throw new NotFoundError(`Charge version workflow ${chargeVersionWorkflowId} not found`);
  }

  setOrThrowInvalidEntityError(model, changes);

  // Persist
  const dbRow = chargeVersionWorkflowMapper.modelToDb(model);
  const data = await chargeVersionWorkflowsRepo.update(chargeVersionWorkflowId, dbRow);
  return chargeVersionWorkflowMapper.dbToModel(data);
};

/**
 * Deletes a charge version workflow record by ID
 * @param {String} chargeVersionWorkflowId
 * @return {Promise}
 */
const deleteById = async chargeVersionWorkflowId => {
  try {
    await chargeVersionWorkflowsRepo.deleteOne(chargeVersionWorkflowId);
  } catch (err) {
    throw new NotFoundError(`Charge version workflow ${chargeVersionWorkflowId} not found`);
  }
};

/**
 * Creates a charge version from the supplied charge version workflow
 * @param {ChargeVersionWorkflow} chargeVersionWorkflow
 * @return {Promise<ChargeVersion>}
 */
const approve = async (chargeVersionWorkflow, approvedBy) => {
  validators.assertIsInstanceOf(chargeVersionWorkflow, ChargeVersionWorkflow);
  validators.assertIsInstanceOf(approvedBy, User);

  const { chargeVersion } = chargeVersionWorkflow;

  // Store users who created/approved
  chargeVersion.fromHash({
    createdBy: chargeVersionWorkflow.createdBy,
    approvedBy
  });

  // Persist the new charge version
  const persistedChargeVersion = await chargeVersionService.create(chargeVersion);

  // Delete the charge version workflow record as it is no longer needed
  await deleteById(chargeVersionWorkflow.id);

  return persistedChargeVersion;
};

exports.getAll = getAll;
exports.getAllWithLicenceHolder = getAllWithLicenceHolder;
exports.getById = getById;
exports.getByIdWithLicenceHolder = getByIdWithLicenceHolder;
exports.create = create;
exports.getLicenceHolderRole = getLicenceHolderRole;
exports.update = update;
exports.delete = deleteById;
exports.approve = approve;
