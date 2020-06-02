'use strict';

const Licence = require('../models/licence');
const Region = require('../models/region');

const regionMapper = require('./region');
const licenceAgreementMapper = require('./licence-agreement');

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
    region: regionMapper.dbToModel(row.region),
    historicalArea: dbToHistoricalArea(row.regions),
    regionalChargeArea: dbToRegionalChargeArea(row.regions),
    startDate: row.startDate,
    expiredDate: row.expiredDate,
    lapsedDate: row.lapsedDate,
    revokedDate: row.revokedDate
  });
  if (row.licenceAgreements) {
    licence.licenceAgreements = row.licenceAgreements.map(licenceAgreementMapper.dbToModel);
  }
  return licence;
};

exports.dbToModel = dbToModel;
