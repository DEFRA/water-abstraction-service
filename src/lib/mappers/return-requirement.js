'use strict'

const { createMapper } = require('../object-mapper')
const helpers = require('./lib/helpers')

const ReturnRequirement = require('../models/return-requirement')
const returnRequirementPurposeMapper = require('./return-requirement-purpose')

const mapReturnRequirementPurposes = rows => rows.map(returnRequirementPurposeMapper.dbToModel)

const dbToModelMapper = createMapper()
  .map('returnRequirementId').to('id')
  .copy('isSummer', 'externalId', 'legacyId')
  .map('returnRequirementPurposes').to('returnRequirementPurposes', mapReturnRequirementPurposes)

/**
 * Maps a row from water.return_requirements to the ReturnRequirement service model
 * @param {Object} row
 * @return {ReturnRequirement} service model
 */
const dbToModel = data => helpers.createModel(ReturnRequirement, data, dbToModelMapper)

exports.dbToModel = dbToModel
