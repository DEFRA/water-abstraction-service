const regionsRepo = require('../connectors/repos/regions')
const mappers = require('../mappers')
const { NotFoundError } = require('../errors')

const getRegion = async regionId => {
  const region = await regionsRepo.findOne(regionId)
  if (region) return mappers.region.dbToModel(region)
  throw new NotFoundError(`Region ${regionId} not found`)
}

exports.getRegion = getRegion
