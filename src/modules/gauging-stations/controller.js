'use strict';

const gaugingStationService = require('../../lib/services/gauging-station-service');
const licenceGaugingStationsService = require('../../lib/services/licence-gauging-stations-service');
const licencesService = require('../../lib/services/licences');
const controllerHelper = require('../../lib/controller');
const gaugingStationsRepo = require('../../lib/connectors/repos/gauging-stations');
const Boom = require('@hapi/boom');
const { logger } = require('../../logger');

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
      abstractionPeriodStartDay,
      abstractionPeriodStartMonth,
      abstractionPeriodEndDay,
      abstractionPeriodEndMonth,
      restrictionType,
      alertType
    } = request.payload;

    // Check that the licence ID belongs to an actual licence.
    await licencesService.getLicenceById(licenceId);

    // Check that the gauging station ID belongs to an actual gauging station.
    await gaugingStationService.getGaugingStation(gaugingStationId);

    return licenceGaugingStationsService.createNewLicenceLink(gaugingStationId, licenceId, {
      licenceVersionPurposeConditionId,
      thresholdUnit,
      thresholdValue,
      abstractionPeriodStartDay,
      abstractionPeriodStartMonth,
      abstractionPeriodEndDay,
      abstractionPeriodEndMonth,
      restrictionType,
      alertType,
      source: 'wrls'
    });
  } catch (e) {
    const { gaugingStationId } = request.params;
    const {
      licenceId
    } = request.payload;
    logger.error(`Something went wrong when attempting to link licence ${licenceId} to station ${gaugingStationId}`, e);
    return e;
  }
};

exports.getGaugingStation = getGaugingStation;
exports.getGaugingStationByRef = getGaugingStationByRef;
exports.getGaugingStationLicencesById = getGaugingStationLicencesById;
exports.createLicenceGaugingStationLink = createLicenceGaugingStationLink;
