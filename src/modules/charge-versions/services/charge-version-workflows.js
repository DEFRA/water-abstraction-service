'use strict';

const errors = require('../../../lib/errors');
const { logger } = require('../../../logger');
const bluebird = require('bluebird');

// Services
const service = require('../../../lib/services/service');
const documentsService = require('../../../lib/services/documents-service');

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
  const { startDate } = chargeVersionWorkflow.chargeVersion;
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

const getByIdWithLicenceHolder = async id => {
  const chargeVersionWorkflow = await getById(id);
  return getLicenceHolderRole(chargeVersionWorkflow);
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
  try {
    chargeVersionWorkflow.fromHash({
      createdBy: user,
      licence: licence,
      chargeVersion,
      status: CHARGE_VERSION_WORKFLOW_STATUS.draft
    });
  } catch (err) {
    logger.error('Invalid charge version workflow', err);
    throw new errors.InvalidEntityError('Invalid charge version workflow');
  }

  const dbRow = chargeVersionWorkflowMapper.modelToDb(chargeVersionWorkflow);
  const updated = await chargeVersionWorkflowsRepo.create(dbRow);
  return chargeVersionWorkflowMapper.dbToModel(updated);
};

exports.getAllWithLicenceHolder = getAllWithLicenceHolder;
exports.getById = getById;
exports.getByIdWithLicenceHolder = getByIdWithLicenceHolder;
exports.create = create;
exports.getLicenceHolderRole = getLicenceHolderRole;
