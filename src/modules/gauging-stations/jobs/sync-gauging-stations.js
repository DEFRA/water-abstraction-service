// Syncs gauging stations from CSV on S3

'use strict';

const moment = require('moment');
const JOB_NAME = 'gauging-stations.sync-from-csv';
const { logger } = require('../../../logger');
const s3Connector = require('../../../lib/services/s3');
const { get: getApplicationState, save: saveApplicationState } = require('../../../lib/services/application-state');
const gaugingStationsRepo = require('../../../lib/connectors/repos/gauging-stations');
const gaugingStationMapper = require('../../../lib/mappers/gauging-station');
const csvKey = 'gauging-stations/gauging-stations.csv';

const createMessage = () => ([
  JOB_NAME,
  {},
  {
    jobId: `${JOB_NAME}.${moment().format('YYYYMMDD')}`,
    repeat: {
      every: 30000 // config.import.gaugingStationsSyncFrequencyInMS
    }
  }
]);

const handler = async job => {
  logger.info(`${JOB_NAME}: Job has started`);

  const { Body, ETag } = await s3Connector.getObject(csvKey);

  const { data } = await getApplicationState('gauging-stations-import');

  const lastEtag = data.etag;

  if (ETag === lastEtag) {
    logger.info('No change detected. Not processing file.');
    return 'No change detected. Not processing file.';
  }

  const derivedArrays = Body.toString().split('\n') // split string to lines
    .map(e => e.trim()) // remove white spaces for each line
    .map(e => e.split(',').map(e => e.trim())); // split each line to array);

  const headers = [
    'hydrology_station_id',
    'station_reference',
    'wiski_id',
    'label',
    'lat',
    'long',
    'easting',
    'northing',
    'grid_reference',
    'catchment_name',
    'river_name'
  ];

  const gaugingStationsInDb = await gaugingStationsRepo.findAll();

  for (let i = 1; i < derivedArrays.length; i++) {
    const data = derivedArrays[i];
    const tempObj = {};

    for (let j = 0; j < data.length; j++) {
      tempObj[headers[j]] = data[j];
    }
    const mappedGaugingStation = gaugingStationMapper.csvToModel(tempObj);

    const stationInDbWithMatchingHydrologyStationId = gaugingStationsInDb.find(station => station.hydrologyStationId === mappedGaugingStation.hydrologyStationId);
    const stationInDbWithMatchingStationReference = gaugingStationsInDb.find(station => station.stationReference === mappedGaugingStation.stationReference);
    const stationInDbWithMatchingWiskiId = gaugingStationsInDb.find(station => station.wiskiId === mappedGaugingStation.wiskiId);

    if (stationInDbWithMatchingHydrologyStationId) {
      mappedGaugingStation.gaugingStationId = stationInDbWithMatchingHydrologyStationId.gaugingStationId;
      await gaugingStationsRepo.update(stationInDbWithMatchingHydrologyStationId.gaugingStationId, mappedGaugingStation);
    } else if (stationInDbWithMatchingStationReference) {
      mappedGaugingStation.id(stationInDbWithMatchingStationReference.gaugingStationId);
      mappedGaugingStation.gaugingStationId = stationInDbWithMatchingStationReference.gaugingStationId;
      await gaugingStationsRepo.update(stationInDbWithMatchingStationReference.gaugingStationId, mappedGaugingStation);
    } else if (stationInDbWithMatchingWiskiId) {
      mappedGaugingStation.gaugingStationId = stationInDbWithMatchingWiskiId.gaugingStationId;
      await gaugingStationsRepo.update(stationInDbWithMatchingWiskiId.gaugingStationId, mappedGaugingStation);
    } else {
      await gaugingStationsRepo.create(mappedGaugingStation);
    }
  }

  saveApplicationState('gauging-stations-import', { etag: ETag });
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
