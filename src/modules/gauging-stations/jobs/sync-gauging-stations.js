// Syncs gauging stations from CSV on S3

'use strict';

// Dependencies
const moment = require('moment');
const { logger } = require('../../../logger');
const s3Connector = require('../../../lib/services/s3');

// Constants
const JOB_NAME = 'gauging-stations.sync-from-csv';
const csvKey = 'gauging-stations/gauging-stations.csv';

// Handy stuff
const config = require('../../../../config');
const { gaugingStationsCSVHeaders, getArraysFromCSV } = require('../helpers');
const { get: getApplicationState, save: saveApplicationState } = require('../../../lib/services/application-state');

// Gauging Stations Repo
const gaugingStationsRepo = require('../../../lib/connectors/repos/gauging-stations');
const gaugingStationMapper = require('../../../lib/mappers/gauging-station');

console.log('§§§§§§§§');
console.log(config.import.gaugingStationsSyncFrequencyInMS);
const createMessage = () => ([
  JOB_NAME,
  {},
  {
    jobId: `${JOB_NAME}.${moment().format('YYYYMMDD')}`,
    repeat: {
      every: 100000 // config.import.gaugingStationsSyncFrequencyInMS
    }
  }
]);

const handler = async job => {
  logger.info(`${JOB_NAME}: Job has started`);

  // Get the Body and the ETag of the S3 object
  const { Body, ETag } = await s3Connector.getObject(csvKey);

  // Get the current application state for the import
  const { data: currentApplicationState } = await getApplicationState('gauging-stations-import');

  if (ETag === currentApplicationState.etag) {
    logger.info('No change detected. Not processing file.');
    return 'No change detected. Not processing file.';
  }

  const arraysFromCSV = getArraysFromCSV(Body);

  const gaugingStationsInDb = await gaugingStationsRepo.findAll();

  for (let i = 1; i < arraysFromCSV.length; i++) {
    const row = arraysFromCSV[i];
    const temporaryObject = {};

    for (let j = 0; j < row.length; j++) {
      temporaryObject[gaugingStationsCSVHeaders[j]] = row[j]; // Set each value
    }

    const mappedGaugingStation = gaugingStationMapper.csvToModel(temporaryObject);

    const stationInDbWithMatchingHydrologyStationId = gaugingStationsInDb.find(station => station.hydrologyStationId === mappedGaugingStation.hydrologyStationId);
    const stationInDbWithMatchingStationReference = gaugingStationsInDb.find(station => station.stationReference === mappedGaugingStation.stationReference);
    const stationInDbWithMatchingWiskiId = gaugingStationsInDb.find(station => station.wiskiId === mappedGaugingStation.wiskiId);

    if (stationInDbWithMatchingHydrologyStationId) {
      // Update the station with the matching Hydrology GUID
      mappedGaugingStation.gaugingStationId = stationInDbWithMatchingHydrologyStationId.gaugingStationId;
      gaugingStationsRepo.update(stationInDbWithMatchingHydrologyStationId.gaugingStationId, mappedGaugingStation);
    } else if (stationInDbWithMatchingStationReference) {
      // Update the station with the matching Station Reference
      mappedGaugingStation.id(stationInDbWithMatchingStationReference.gaugingStationId);
      mappedGaugingStation.gaugingStationId = stationInDbWithMatchingStationReference.gaugingStationId;
      gaugingStationsRepo.update(stationInDbWithMatchingStationReference.gaugingStationId, mappedGaugingStation);
    } else if (stationInDbWithMatchingWiskiId) {
      // Update the station with the matching Wiski ID
      mappedGaugingStation.gaugingStationId = stationInDbWithMatchingWiskiId.gaugingStationId;
      gaugingStationsRepo.update(stationInDbWithMatchingWiskiId.gaugingStationId, mappedGaugingStation);
    } else {
      // Nothing else matches... Create a new row in the database.
      gaugingStationsRepo.create(mappedGaugingStation);
    }
  }

  return saveApplicationState('gauging-stations-import', { etag: ETag });
};

const onFailedHandler = async (job, err) => {
  logger.error(`${JOB_NAME}: Job has failed`, err);
};

const onComplete = async (job, queueManager) => {
  logger.info(`${JOB_NAME}: Job has completed`);
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handler;
exports.onFailed = onFailedHandler;
exports.onComplete = onComplete;
exports.hasScheduler = true;
