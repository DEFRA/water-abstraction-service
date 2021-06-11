'use strict';

const gaugingStationService = require('../../lib/services/gauging-station-service');
const controller = require('../../lib/controller');
const gaugingStationsRepo = require('../../lib/connectors/repos/gauging-stations');
const Boom = require('@hapi/boom');

const getGaugingStation = async request => {
  const { stationGuid } = request.params;
  const gaugingStation = await gaugingStationsRepo.findOne(stationGuid);
  return gaugingStation || Boom.notFound(`Gauging station ${stationGuid} not found`);
};

const getGaugingStationByRef = async request =>
  controller.getEntities(
    request.params.stationRef,
    gaugingStationService.getGaugingStationByRef
  );

const getGaugingStationLicencesById = async request =>
  controller.getEntities(
    request.params.gaugingStationId,
    gaugingStationService.getGaugingStationLicencesById
  );

exports.getGaugingStation = getGaugingStation;
exports.getGaugingStationByRef = getGaugingStationByRef;
exports.getGaugingStationLicencesById = getGaugingStationLicencesById;
