const repos = require('../../../lib/connectors/repository');
const Licence = require('../../../lib/models/licence');
const Region = require('../../../lib/models/region');

const mapDBToModel = row => {
  const licence = new Licence();
  licence.fromHash({
    id: row.licence_id,
    licenceNumber: row.licence_ref,
    isWaterUndertaker: row.is_water_undertaker
  });

  // NALD region
  licence.region = new Region();
  licence.region.fromHash({
    type: Region.types.region,
    id: row.region_id,
    name: row.region_name,
    code: row.charge_region_id,
    numericCode: row.nald_region_id
  });

  // Historical EA area
  licence.historicalArea = new Region();
  licence.historicalArea.fromHash({
    type: Region.types.environmentAgencyArea,
    code: row.regions.historicalAreaCode
  });

  // Regional charging area
  licence.regionalChargeArea = new Region();
  licence.regionalChargeArea.fromHash({
    type: Region.types.regionalChargeArea,
    name: row.regions.regionalChargeArea
  });

  return licence;
};

/**
 * Gets a licence by licence number
 * @param {String} licenceNumber
 * @return {Promise<Licence>}
 */
const getByLicenceNumber = async licenceNumber => {
  const row = await repos.licences.findOneByLicenceNumber(licenceNumber);
  return mapDBToModel(row);
};

exports.mapDBToModel = mapDBToModel;
exports.getByLicenceNumber = getByLicenceNumber;
