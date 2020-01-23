const Region = require('../../../lib/models/region');

/**
 * Maps a row from water.regions to a Region model
 * @param {Object} row
 * @return {Region}
 */
const mapDBToModel = row => {
  const region = new Region();
  region.fromHash({
    type: Region.types.region,
    id: row.region_id,
    name: row.name,
    code: row.charge_region_id,
    numericCode: row.nald_region_id
  });
  return region;
};

exports.mapDBToModel = mapDBToModel;
