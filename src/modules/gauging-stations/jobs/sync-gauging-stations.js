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
const helpers = require('../helpers');
const applicationState = require('../../../lib/services/application-state');

// Gauging Stations Repo
const gaugingStationsRepo = require('../../../lib/connectors/repos/gauging-stations');
const gaugingStationMapper = require('../../../lib/mappers/gauging-station');

const createMessage = () => ([
  JOB_NAME,
  {},
  {
    jobId: `${JOB_NAME}.${moment().format('YYYYMMDD')}`,
    repeat: {
      every: config.import.gaugingStationsSyncFrequencyInMS
    }
  }
]);

const handler = async () => {
  logger.info(`${JOB_NAME}: Job has started`);

  // Get the Body and the ETag of the S3 object
  const { Body, ETag } = await s3Connector.getObject(csvKey);

  // Get the current application state for the import
  const { data: currentApplicationState } = await applicationState.get('gauging-stations-import');

  if (ETag === currentApplicationState.etag) {
    logger.info('No change detected. Not processing file.');
    return 'No change detected. Not processing file.';
  }

  const arraysFromCSV = await helpers.getArraysFromCSV(Body);

  const gaugingStationsInDb = await gaugingStationsRepo.findAll();

  for (let i = 1; i < arraysFromCSV.length; i++) {
    const row = arraysFromCSV[i];
    const temporaryObject = {};

    for (let j = 0; j < row.length; j++) {
      temporaryObject[helpers.gaugingStationsCSVHeaders[j]] = row[j]; // Set each value
    }

    const mappedGaugingStation = gaugingStationMapper.csvToModel(temporaryObject);

    const stationInDbWithMatchingHydrologyStationId = gaugingStationsInDb.find(station => station.hydrologyStationId && station.hydrologyStationId === mappedGaugingStation.hydrologyStationId);
    const stationInDbWithMatchingStationReference = gaugingStationsInDb.find(station => station.stationReference && station.stationReference === mappedGaugingStation.stationReference);
    const stationInDbWithMatchingWiskiId = gaugingStationsInDb.find(station => station.wiskiId && station.wiskiId === mappedGaugingStation.wiskiId);

    if (stationInDbWithMatchingHydrologyStationId) {
      // Update the station with the matching Hydrology GUID
      mappedGaugingStation.gaugingStationId = stationInDbWithMatchingHydrologyStationId.gaugingStationId;
      await gaugingStationsRepo.update(stationInDbWithMatchingHydrologyStationId.gaugingStationId, mappedGaugingStation);
    } else if (stationInDbWithMatchingStationReference) {
      // Update the station with the matching Station Reference
      mappedGaugingStation.gaugingStationId = stationInDbWithMatchingStationReference.gaugingStationId;
      await gaugingStationsRepo.update(stationInDbWithMatchingStationReference.gaugingStationId, mappedGaugingStation);
    } else if (stationInDbWithMatchingWiskiId) {
      // Update the station with the matching Wiski ID
      mappedGaugingStation.gaugingStationId = stationInDbWithMatchingWiskiId.gaugingStationId;
      await gaugingStationsRepo.update(stationInDbWithMatchingWiskiId.gaugingStationId, mappedGaugingStation);
    } else {
      // Nothing else matches... Create a new row in the database.
      await gaugingStationsRepo.create(mappedGaugingStation);
    }
  }

  return applicationState.save('gauging-stations-import', { etag: ETag });
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
