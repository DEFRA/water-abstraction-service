const regionsRepo = require('../connectors/repos/regions');
const { NotFoundError } = require('../errors');

const getRegionCode = async regionId => {
  const region = await regionsRepo.findOne(regionId);
  if (region) return region.chargeRegionId;
  throw new NotFoundError(`Region ${regionId} not found`);
};

exports.getRegionCode = getRegionCode;
