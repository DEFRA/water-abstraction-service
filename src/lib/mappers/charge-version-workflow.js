'use strict'

const chargeVersionMapper = require('./charge-version')
const userMapper = require('./user')
const licenceMapper = require('./licence')
const licenceVersionMapper = require('./licence-version')
const regionMapper = require('./region')

const ChargeVersionWorkflow = require('../models/charge-version-workflow')

const { createMapper } = require('../object-mapper')
const helpers = require('./lib/helpers')

const dbToModelMapper = createMapper()
  .map('chargeVersionWorkflowId').to('id')
  .map('createdBy').to('createdBy', userMapper.dbToModel)
  .map('approverComments').to('approverComments')
  .map('status').to('status')
  .map('dateCreated').to('dateCreated')
  .map('dateUpdated').to('dateUpdated')
  .map('data').to('chargeVersion', data => chargeVersionMapper.pojoToModel(data.chargeVersion))
  .map('licence').to('licence', licenceMapper.dbToModel)
  .map('licence.region').to('chargeVersion.region', regionMapper.dbToModel)
  .map('licenceVersion').to('licenceVersion', licenceVersionMapper.dbToModel)
  .map('dateDeleted').to('dateDeleted')

/**
 * Converts DB representation to a ChargeVersionWorkflow service model
 * @param {Object} row
 * @return {ChargeVersionWorkflow}
 */
const dbToModel = row =>
  helpers.createModel(ChargeVersionWorkflow, row, dbToModelMapper)

const modelToDbMapper = createMapper()
  .map('id').to('chargeVersionWorkflowId')
  .map('licence.id').to('licenceId')
  .map('approverComments').to('approverComments')
  .map('status').to('status')
  .map('createdBy').to('createdBy', userMapper.modelToDb)
  .map('chargeVersion').to('data.chargeVersion', chargeVersion => chargeVersion ? chargeVersion.toJSON() : null)
  .map('licenceVersionId').to('licenceVersionId')
  .map('dateDeleted').to('dateDeleted')

/**
 * Converts ChargeVersionWorkflow service model to a DB row
 * @param {ChargeVersionWorkflow} model
 * @return {Object}
 */
const modelToDb = model => modelToDbMapper.execute(model)

exports.dbToModel = dbToModel
exports.modelToDb = modelToDb
