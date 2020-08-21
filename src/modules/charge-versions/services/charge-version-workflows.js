'use strict';

const chargeVersionWorkflowsRepo = require('../../../lib/connectors/repos/charge-information-workflows');
const chargeVersionWorkflowMapper = require('../../../lib/mappers/charge-version-workflow');
const service = require('../../../lib/services/service');
const errors = require('../../../lib/errors');
// const chargeVersionMapper = require('../../../lib/mappers/charge-version');
// const userMapper = require('../../../lib/mappers/user');
const { logger } = require('../../../logger');

// Services

// Models
const validators = require('../../../lib/models/validators');
const ChargeVersionWorkflow = require('../../../lib/models/charge-version-workflow');
const { CHARGE_VERSION_WORKFLOW_STATUS } = require('../../../lib/models/charge-version-workflow');
const ChargeVersion = require('../../../lib/models/charge-version');
const User = require('../../../lib/models/user');
const Licence = require('../../../lib/models/licence');

/**
 * Gets all charge version workflows from the DB
 * @return {Promise<Array>}
 */
const getAll = () => service.findAll(chargeVersionWorkflowsRepo.findAll, chargeVersionWorkflowMapper);

/**
 * Create a new charge version workflow record
 * @param {String} licenceId - guid
 * @param {*} chargeVersion
 * @param {*} user
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
      licenceId: licence.id,
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

exports.getAll = getAll;
exports.create = create;
