'use strict';

const gaugingStationsService = require('../../lib/services/gauging-station-service');
const controller = require('../../lib/controller');

const getGaugingStation = async request =>
  controller.getEntities(
    request.params.gaugingStationId,
    gaugingStationsService.getGaugingStations
  );

const getGaugingStationByRef = async request =>
  controller.getEntities(
    request.params.stationRef,
    gaugingStationsService.getGaugingStationByRef
  );

const getGaugingStationConditionsForId = async request =>
  controller.getEntities(
    request.params.gaugingStationId,
    gaugingStationsService.getGaugingStationConditionsForId
  );

exports.getGaugingStation = getGaugingStation;
exports.getGaugingStationByRef = getGaugingStationByRef;
exports.getGaugingStationConditionsForId = getGaugingStationConditionsForId;