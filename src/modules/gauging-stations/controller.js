'use strict';

const gaugingStationService = require('../../lib/services/gauging-station-service');
const controller = require('../../lib/controller');

const getGaugingStation = async request =>
  controller.getEntities(
    request.params.gaugingStationId,
    gaugingStationService.getGaugingStations
  );

const getGaugingStationByRef = async request =>
  controller.getEntities(
    request.params.stationRef,
    gaugingStationService.getGaugingStationByRef
  );

const getGaugingStationConditionsById = async request =>
  controller.getEntities(
    request.params.gaugingStationId,
    gaugingStationService.getGaugingStationConditionsById
  );

const getGaugingStationsByLicenceId = async request =>
  controller.getEntities(
    request.params.licenceId,
    gaugingStationService.getGaugingStationsByLicenceId
  );

exports.getGaugingStation = getGaugingStation;
exports.getGaugingStationByRef = getGaugingStationByRef;
exports.getGaugingStationConditionsById = getGaugingStationConditionsById;
exports.getGaugingStationsByLicenceId = getGaugingStationsByLicenceId;
