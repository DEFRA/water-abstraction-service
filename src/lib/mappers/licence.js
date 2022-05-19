'use strict'

const { createMapper } = require('../object-mapper')
const helpers = require('./lib/helpers')

const Licence = require('../models/licence')
const Region = require('../models/region')

const regionMapper = require('./region')
const licenceAgreementMapper = require('./licence-agreement')

const dbToHistoricalArea = licenceRegions => {
  const region = new Region()
  region.fromHash({
    type: Region.types.environmentAgencyArea,
    code: licenceRegions.historicalAreaCode
  })
  return region
}

const dbToRegionalChargeArea = licenceRegions => {
  const region = new Region()
  region.fromHash({
    type: Region.types.regionalChargeArea,
    name: licenceRegions.regionalChargeArea
  })
  return region
}

const dbToModelMapper = createMapper()
  .map('licenceId').to('id')
  .map('licenceRef').to('licenceNumber')
  .copy(
    'isWaterUndertaker',
    'startDate',
    'expiredDate',
    'lapsedDate',
    'revokedDate',
    'includeInSupplementaryBilling'
  )
  .map('regions').to('historicalArea', dbToHistoricalArea)
  .map('regions').to('regionalChargeArea', dbToRegionalChargeArea)
  .map('region').to('region', regionMapper.dbToModel)
  .map('licenceAgreements').to('licenceAgreements', licenceAgreements => licenceAgreements.map(licenceAgreementMapper.dbToModel))

/**
 * Maps database licence to Licence service model
 * @param {Object} row
 * @return {Licence} service model
 */
const dbToModel = row => helpers.createModel(Licence, row, dbToModelMapper)

exports.dbToModel = dbToModel
