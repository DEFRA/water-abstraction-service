'use strict';

const Licence = require('../../../lib/models/licence');
const Region = require('../../../lib/models/region');

const region = require('./region');

const dbToHistoricalArea = licenceRegions => {
  const region = new Region();
  region.fromHash({
    type: Region.types.environmentAgencyArea,
    code: licenceRegions.historicalAreaCode
  });
  return region;
};

const dbToRegionalChargeArea = licenceRegions => {
  const region = new Region();
  region.fromHash({
    type: Region.types.regionalChargeArea,
    name: licenceRegions.regionalChargeArea
  });
  return region;
};

const dbToModel = row => {
  const licence = new Licence();
  licence.fromHash({
    id: row.licenceId,
    licenceNumber: row.licenceRef,
    isWaterUndertaker: row.isWaterUndertaker,
    region: region.dbToModel(row.region),
    historicalArea: dbToHistoricalArea(row.regions),
    regionalChargeArea: dbToRegionalChargeArea(row.regions),
    startDate: row.startDate,
    expiredDate: row.expiredDate,
    lapsedDate: row.lapsedDate,
    revokedDate: row.revokedDate
  });
  return licence;
};

exports.dbToModel = dbToModel;
