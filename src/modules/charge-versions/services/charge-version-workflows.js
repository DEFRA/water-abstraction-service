'use strict';

const bluebird = require('bluebird');
const { get } = require('lodash');
// Services
const service = require('../../../lib/services/service');
const documentsService = require('../../../lib/services/documents-service');
const chargeVersionService = require('../../../lib/services/charge-versions');
const licencesService = require('../../../lib/services/licences');
// Repos
const chargeVersionWorkflowsRepo = require('../../../lib/connectors/repos/charge-version-workflows');

// Mappers
const chargeVersionWorkflowMapper = require('../../../lib/mappers/charge-version-workflow');

// Models
const validators = require('../../../lib/models/validators');
const ChargeVersionWorkflow = require('../../../lib/models/charge-version-workflow');
const { CHARGE_VERSION_WORKFLOW_STATUS } = require('../../../lib/models/charge-version-workflow');
const ChargeVersion = require('../../../lib/models/charge-version');
const User = require('../../../lib/models/user');
const Licence = require('../../../lib/models/licence');
const Role = require('../../../lib/models/role');
const { NotFoundError, InvalidEntityError } = require('../../../lib/errors');
const { logger } = require('../../../logger');

const chargeVersionWorkflowsRepoFindAllWithPaging = async (page, perPage, tabFilter) =>
  chargeVersionWorkflowsRepo.findAllWithPaging(page, perPage, tabFilter);

/**
 * Gets all charge version workflows from the DB
 * @return {Promise<Array>}
 */
const getAll = () => service.findAll(chargeVersionWorkflowsRepo.findAll, chargeVersionWorkflowMapper);

const getAllWithPaging = (page, perPage, tabFilter) =>
  service.findAllWithPaging(chargeVersionWorkflowsRepoFindAllWithPaging, chargeVersionWorkflowMapper, page, perPage, tabFilter);

/**
 * Gets the licence-holder role for the supplied ChargeVersionWorkflow model
 * This is based on the licence number, and the start date of the charge
 * version
 * @param {ChargeVersionWorkflow} chargeVersionWorkflow
 * @return {Promise<Role>}
 */
const getLicenceHolderRole = async chargeVersionWorkflow => {
  const { licenceNumber } = chargeVersionWorkflow.licence;
  const startDate = chargeVersionWorkflow.status === 'to_setup'
    ? chargeVersionWorkflow.licenceVersion.startDate
    : get(chargeVersionWorkflow, 'chargeVersion.dateRange.startDate', null);

  const doc = await documentsService.getValidDocumentOnDate(licenceNumber, startDate);
  const role = doc ? doc.getRoleOnDate(Role.ROLE_NAMES.licenceHolder, startDate) : {};

  return {
    ...chargeVersionWorkflow.toJSON(),
    licenceHolderRole: role
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

const getAllWithLicenceHolderWithPaging = async (page = 1, perPage = 10, tabFilter = '') => {
  const chargeVersionWorkflows = await getAllWithPaging(page, perPage, tabFilter);
  const data = await bluebird.map(chargeVersionWorkflows.data, getLicenceHolderRole);
  return {
    data: data,
    pagination: chargeVersionWorkflows.pagination
  };
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
 * Gets all charge version workflow for the
 * given licence id
 * @param {String} licenceId
 */
const getManyByLicenceId = async licenceId =>
  service.findMany(licenceId, chargeVersionWorkflowsRepo.findManyForLicence, chargeVersionWorkflowMapper);

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
    throw new InvalidEntityError(`Invalid data for charge version workflow ${chargeVersionWorkflow.id}`);
  }
};

/**
 * Create a new charge version workflow record
 * @param {Licence} licence
 * @param {ChargeVersion} chargeVersion
 * @param {User} user
 * @return {Promise<ChargeVersionWorkflow>}
 */
const create = async (licence, chargeVersion, user, status = CHARGE_VERSION_WORKFLOW_STATUS.review, licenceVersionId = null) => {
  validators.assertIsInstanceOf(licence, Licence);
  validators.assertNullableId(licenceVersionId);

  if (status !== CHARGE_VERSION_WORKFLOW_STATUS.toSetup) {
    validators.assertIsInstanceOf(chargeVersion, ChargeVersion);
    validators.assertIsInstanceOf(user, User);
  }

  // Map all data to ChargeVersionWorkflow model
  const chargeVersionWorkflow = new ChargeVersionWorkflow();

  setOrThrowInvalidEntityError(chargeVersionWorkflow, {
    createdBy: user,
    licence: licence,
    chargeVersion,
    status,
    licenceVersionId
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
 * @param {ChargeVersionWorkflow} chargeVersionWorkflow
 * @return {Promise}
 */
const deleteOne = async (chargeVersionWorkflow, isSoftDelete = true) => {
  try {
    const deleteFunc = isSoftDelete
      ? chargeVersionWorkflowsRepo.softDeleteOne
      : chargeVersionWorkflowsRepo.deleteOne;
    await deleteFunc(chargeVersionWorkflow.id);
  } catch (err) {
    throw new NotFoundError(`Charge version workflow ${chargeVersionWorkflow.id} not found`);
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

  const { chargeVersion, licence } = chargeVersionWorkflow;

  // Store users who created/approved
  chargeVersion.fromHash({
    createdBy: chargeVersionWorkflow.createdBy,
    approvedBy,
    licence
  });

  // Persist the new charge version
  const persistedChargeVersion = await chargeVersionService.create(chargeVersion);

  // flag for supplementary billing
  await licencesService.flagForSupplementaryBilling(chargeVersionWorkflow.licence.id);

  // Delete the charge version workflow record as it is no longer needed
  await deleteOne(chargeVersionWorkflow, false);

  return persistedChargeVersion;
};

exports.getAll = getAll;
exports.getAllWithPaging = getAllWithPaging;
exports.getAllWithLicenceHolderWithPaging = getAllWithLicenceHolderWithPaging;
exports.getAllWithLicenceHolder = getAllWithLicenceHolder;
exports.getById = getById;
exports.getByIdWithLicenceHolder = getByIdWithLicenceHolder;
exports.create = create;
exports.getLicenceHolderRole = getLicenceHolderRole;
exports.getManyByLicenceId = getManyByLicenceId;
exports.update = update;
exports.delete = deleteOne;
exports.approve = approve;
