'use strict'

const { createMapper } = require('../../../lib/object-mapper')
const { createModel } = require('../../../lib/mappers/lib/helpers')

// Models
const BillingVolume = require('../../../lib/models/billing-volume')
const FinancialYear = require('../../../lib/models/financial-year')

// Mappers
const userMapper = require('../../../lib/mappers/user')
const chargeElementMapper = require('../../../lib/mappers/charge-element')

const { isDecimal } = require('../../../lib/decimal-helpers')

const dbToModelMapper = createMapper()
  .map('billingVolumeId').to('id')
  .copy(
    'chargeElementId',
    'isSummer',
    'twoPartTariffError',
    'twoPartTariffStatus',
    'isApproved',
    'volume',
    'calculatedVolume',
    'billingBatchId'
  )
  .map('financialYear').to('financialYear', financialYearEnding => new FinancialYear(financialYearEnding))
  .map('twoPartTariffReview').to('twoPartTariffReview', userMapper.dbToModel)
  .map('chargeElement').to('chargeElement', chargeElementMapper.dbToModel)

const dbToModel = row => createModel(BillingVolume, row, dbToModelMapper)

const calculatedVolumeMapper = value => isDecimal(value) ? value.toDecimalPlaces(6).toNumber() : value

const modelToDbMapper = createMapper()
  .map('id').to('billingVolumeId')
  .copy(
    'chargeElementId',
    'isSummer',
    'twoPartTariffError',
    'twoPartTariffStatus',
    'isApproved',
    'volume',
    'calculatedVolume',
    'billingBatchId'
  )
  .map('calculatedVolume').to('calculatedVolume', calculatedVolumeMapper)
  .map('financialYear').to('financialYear', financialYear => financialYear.endYear)
  .map('twoPartTariffReview').to('twoPartTariffReview', userMapper.modelToDb)

const modelToDb = model => modelToDbMapper.execute(model)

exports.dbToModel = dbToModel
exports.modelToDb = modelToDb
