'use strict';
const gaugingStationRepo = require('../connectors/repos/gauging-stations');
const gaugingStationMapper = require('../mappers/gauging-station');
const { NotFoundError } = require('../errors');
const service = require('./service');

const getGaugingStation = async gaugingStationId =>
  service.findOne(gaugingStationId, gaugingStationRepo.findOne, gaugingStationMapper);

const getGaugingStationByRef = async stationRef => {
  const gaugingStationResponseRef = await gaugingStationRepo.findOneByStationRef(stationRef);
  if (gaugingStationResponseRef) {
    return gaugingStationMapper.dbToModel(gaugingStationResponseRef);
  }
  throw new NotFoundError(`Could not find a gauging station with ref ${stationRef}`);
};

const getGaugingStationLicencesById = async gaugingStationId => {
  const gaugingStationConditions = await gaugingStationRepo.findLicenceConditionsByStationId(gaugingStationId);
  if (gaugingStationConditions) {
    return gaugingStationConditions;
  }
  throw new NotFoundError(`Could not find gauging station conditions with ID ${gaugingStationId}`);
};

const getGaugingStationsByLicenceId = async licenceId => gaugingStationRepo.findGaugingStationByLicenceId(licenceId);

exports.getGaugingStation = getGaugingStation;
exports.getGaugingStationByRef = getGaugingStationByRef;
exports.getGaugingStationLicencesById = getGaugingStationLicencesById;
exports.getGaugingStationsByLicenceId = getGaugingStationsByLicenceId;
