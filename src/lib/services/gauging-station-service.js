'use strict';
const gaugingStationRepo = require('../connectors/repos/gauging-stations');
const gaugingStationMapper = require('../mappers/gauging-station');
const { NotFoundError } = require('../errors');

const getGaugingStations = async gaugingStationId => {
  const gaugingStationResponse = await gaugingStationRepo.findOne(gaugingStationId);
  if (gaugingStationResponse) {
    return gaugingStationMapper.dbToModel(gaugingStationResponse);
  }
  throw new NotFoundError(`Could not find gauging station with ID ${gaugingStationId}`);
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
