'use strict'

const Agreement = require('../models/agreement')
const { createMapper } = require('../object-mapper')
const helpers = require('./lib/helpers')

const dbToModelMapper = createMapper()
  .map('financialAgreementTypeId').to('id')
  .map('financialAgreementCode').to('code')
  .copy(
    'dateCreated',
    'dateUpdated',
    'dateDeleted'
  )

/**
 * Maps row from water.financial_agreement_types to Agreement service model
 * @param {Object} - row from water.financial_agreement_types
 * @return {Agreement}
 */
const dbToModel = row =>
  helpers.createModel(Agreement, row, dbToModelMapper)

exports.dbToModel = dbToModel
