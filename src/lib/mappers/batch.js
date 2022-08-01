'use strict'

const Batch = require('../../lib/models/batch')
const FinancialYear = require('../../lib/models/financial-year')
const regionMapper = require('../../lib/mappers/region')

const { createMapper } = require('../../lib/object-mapper')
const helpers = require('../../lib/mappers/lib/helpers')

const dbToModelMapper = createMapper({ mapNull: false })
  .copy(
    'isSummer',
    'status',
    'dateCreated',
    'dateUpdated',
    'errorCode',
    'externalId',
    'billRunNumber',
    'creditNoteCount',
    'invoiceCount',
    'netTotal',
    'invoiceValue',
    'source',
    'transactionFileReference',
    'scheme'
  )
  .map('creditNoteValue').to('creditNoteValue', value => -Math.abs(value))
  .map('billingBatchId').to('id')
  .map('batchType').to('type')
  .map('fromFinancialYearEnding').to('startYear', fromFinancialYearEnding => new FinancialYear(fromFinancialYearEnding))
  .map('toFinancialYearEnding').to('endYear', toFinancialYearEnding => new FinancialYear(toFinancialYearEnding))
  .map('region').to('region', regionMapper.dbToModel)

/**
 * Converts DB representation to a Batch service model
 * @param {Object} row
 * @return {Batch}
 */
const dbToModel = row =>
  helpers.createModel(Batch, row, dbToModelMapper)

exports.dbToModel = dbToModel
