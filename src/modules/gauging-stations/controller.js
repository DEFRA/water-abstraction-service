'use strict';

const gaugingStationService = require('../../lib/services/gauging-station-service');
const licenceGaugingStationsService = require('../../lib/services/licence-gauging-stations-service');
const licencesService = require('../../lib/services/licences');
const controllerHelper = require('../../lib/controller');
const gaugingStationsRepo = require('../../lib/connectors/repos/gauging-stations');
const Boom = require('@hapi/boom');
const { abstractionPeriodInObjectParser } = require('./helpers');
const { logger } = require('../../logger');

const getGaugingStations = () => gaugingStationsRepo.findAll();

const getGaugingStation = async request => {
  const { stationGuid } = request.params;
  const gaugingStation = await gaugingStationsRepo.findOne(stationGuid);
  return gaugingStation || Boom.notFound(`Gauging station ${stationGuid} not found`);
};

const getGaugingStationByRef = async request =>
  controllerHelper.getEntities(
    request.params.stationRef,
    gaugingStationService.getGaugingStationByRef
  );

const getGaugingStationLicencesById = async request =>
  controllerHelper.getEntities(
    request.params.gaugingStationId,
    gaugingStationService.getGaugingStationLicencesById
  );

const createLicenceGaugingStationLink = async request => {
  try {
    const { gaugingStationId } = request.params;
    const {
      licenceId,
      licenceVersionPurposeConditionId,
      thresholdUnit,
      thresholdValue,
      abstractionPeriod,
      restrictionType,
      alertType
    } = request.payload;

    // Check that the licence ID belongs to an actual licence.
    const licence = await licencesService.getLicenceById(licenceId);
    if (!licence) {
      return Boom.notFound(`Licence with ID ${licenceId} could not be found`);
    }

    // Check that the gauging station ID belongs to an actual gauging station.
    const gaugingStation = await gaugingStationService.getGaugingStation(gaugingStationId);

    if (!gaugingStation) {
      return Boom.notFound(`Gauging Station with ID ${gaugingStationId} could not be found`);
    }

    return licenceGaugingStationsService.createNewLicenceLink(gaugingStationId, licenceId, abstractionPeriodInObjectParser({
      licenceVersionPurposeConditionId,
      thresholdUnit,
      thresholdValue,
      abstractionPeriod,
      restrictionType,
      alertType,
      source: 'wrls'
    }));
  } catch (e) {
    const { gaugingStationId } = request.params;
    const {
      licenceId
    } = request.payload;
    logger.error(`Something went wrong when attempting to link licence ${licenceId} to station ${gaugingStationId}`, e);
    return e;
  }
};

exports.getGaugingStations = getGaugingStations;
exports.getGaugingStation = getGaugingStation;
exports.getGaugingStationByRef = getGaugingStationByRef;
exports.getGaugingStationLicencesById = getGaugingStationLicencesById;
exports.createLicenceGaugingStationLink = createLicenceGaugingStationLink;
