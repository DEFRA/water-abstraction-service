'use strict'

const { createMapper } = require('../object-mapper')
const { createModel } = require('./lib/helpers')
const DateRange = require('../models/date-range')
const LicenceAgreement = require('../models/licence-agreement')

const agreementMapper = require('./agreement')

const dbToModelMapper = createMapper()
  .map('licenceAgreementId').to('id')
  .map('licenceRef').to('licenceNumber')
  .map(['startDate', 'endDate']).to('dateRange', (startDate, endDate) => new DateRange(startDate, endDate))
  .map('financialAgreementType').to('agreement', agreementMapper.dbToModel)
  .map('dateSigned').to('dateSigned')
  .map('dateDeleted').to('dateDeleted')

const dbToModel = row => createModel(LicenceAgreement, row, dbToModelMapper)

const modelToDbMapper = createMapper()
  .map('licenceNumber').to('licenceRef')
  .map('dateRange.startDate').to('startDate')
  .map('dateRange.endDate').to('endDate')
  .map('dateSigned').to('dateSigned')
  .map('agreement.id').to('financialAgreementTypeId')

const modelToDb = model => modelToDbMapper.execute(model)

exports.dbToModel = dbToModel
exports.modelToDb = modelToDb
