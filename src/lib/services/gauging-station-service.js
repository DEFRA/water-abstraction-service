'use strict';
const gaugingStationRepo = require('../connectors/repos/gauging-stations');
const gaugingStationMapper = require('../mappers/gauging-station');
const { NotFoundError } = require('../errors');

const getGaugingStations = async gaugingStationId => {
  const gaugingStationResponse = await gaugingStationRepo.findOne(gaugingStationId);
  if (gaugingStationResponse) return gaugingStationMapper.dbToModel(gaugingStationResponse);
  throw new NotFoundError('GaugingStations by id not found');
};

const getGaugingStationsByRef = async stationRef => {
  const gaugingStationResponseRef = await gaugingStationRepo.findOneByStationRef(stationRef);
  if (gaugingStationResponseRef) return gaugingStationMapper.dbToModel(gaugingStationResponseRef);
  throw new NotFoundError('GaugingStations by ref not found');
};

const getGaugingStationConditionsForId = async gaugingStationId => {
  const gaugingStationConditions = await gaugingStationRepo.findStationConditionsForId(gaugingStationId);
  if (gaugingStationConditions) return gaugingStationConditions;
  throw new NotFoundError('GaugingStations conditions by id not found');
};

exports.getGaugingStations = getGaugingStations;
exports.getGaugingStationsByRef = getGaugingStationsByRef;
exports.getGaugingStationConditionsForId = getGaugingStationConditionsForId;
