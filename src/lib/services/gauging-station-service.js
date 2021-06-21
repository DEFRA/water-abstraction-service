'use strict';
const gaugingStationRepo = require('../connectors/repos/gauging-stations');
const gaugingStationMapper = require('../mappers/gauging-station');
const { NotFoundError } = require('../errors');

const getGaugingStations = async () => {
  const gaugingStationResponse = await gaugingStationRepo.findAll();
  return gaugingStationResponse.map(gaugingStationMapper.dbToModel);
};

const getGaugingStationsByRef = async stationRef => {
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

exports.getGaugingStations = getGaugingStations;
exports.getGaugingStationsByRef = getGaugingStationsByRef;
exports.getGaugingStationLicencesById = getGaugingStationLicencesById;
