'use strict'

const { createMapper } = require('../object-mapper')
const helpers = require('./lib/helpers')

const purposeUseMapper = require('./purpose-use')
const ReturnRequirementPurpose = require('../models/return-requirement-purpose')

const dbToModelMapper = createMapper()
  .map('returnRequirementPurposeId').to('id')
  .copy('purposeAlias')
  .map('purposeUse').to('purposeUse', purposeUseMapper.dbToModel)

/**
 * Maps a row from water.return_requirement_purposes to the ReturnRequirementPurpose service model
 * @param {Object} row
 * @return {ReturnRequirementPurpose} service model
 */
const dbToModel = data => helpers.createModel(ReturnRequirementPurpose, data, dbToModelMapper)

exports.dbToModel = dbToModel
