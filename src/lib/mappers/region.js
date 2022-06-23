'use strict'

const camelCaseKeys = require('../camel-case-keys')
const Region = require('../models/region')

/**
 * Maps a row from water.regions to a Region model
 * @param {Object} row - camel cased
 * @return {Region}
 */
const dbToModel = data => {
  if (!data) {
    return null
  }
  const row = camelCaseKeys(data)
  const region = new Region()
  region.fromHash({
    type: Region.types.region,
    id: row.regionId,
    name: row.name,
    code: row.chargeRegionId,
    numericCode: row.naldRegionId,
    displayName: row.displayName
  })
  return region
}

const create = (type, props = {}) => {
  const region = new Region()
  region.fromHash(props)
  return region
}

/**
 * @param {Object} regions - from water.licences.regions jsonb field
 * @return {Object} region instances
 */
const licenceRegionsToModels = regions => ({
  historicalArea: create(Region.types.environmentAgencyArea, { code: regions.historicalAreaCode }),
  regionalChargeArea: create(Region.types.regionalChargeArea, { name: regions.regionalChargeArea })
})

exports.dbToModel = dbToModel
exports.licenceRegionsToModels = licenceRegionsToModels
