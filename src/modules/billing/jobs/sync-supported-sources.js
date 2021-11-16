// Syncs Supported Sources from CSV file stored on S3 bucket
'use strict';

// Dependencies
const { pick, isEqual } = require('lodash');
const moment = require('moment');
const BlueBirdPromise = require('bluebird');
const csvParse = BlueBirdPromise.promisify(require('csv-parse'));
const { logger } = require('../../../logger');
const s3Connector = require('../../../lib/services/s3');

// Constants
const JOB_NAME = 'billing.supported-sources.sync-from-csv';
const csvKey = 'billing-metadata/supported-sources.csv';

// Handy stuff
const config = require('../../../../config');
const applicationState = require('../../../lib/services/application-state');

// Supported Sources Repo
const supportedSourcesRepo = require('../../../lib/connectors/repos/supported-sources');
const supportedSourcesMapper = require('../../../lib/mappers/supported-source');

const createMessage = () => ([
  JOB_NAME,
  {},
  {
    jobId: `${JOB_NAME}.${moment().format('YYYYMMDD')}`,
    repeat: {
      every: config.import.supportedSourcesSyncFrequencyInMS
    }
  }
]);

const handler = async () => {
  logger.info(`${JOB_NAME}: Job has started`);

  // Get the Body and the ETag of the S3 object
  const { Body, ETag } = await s3Connector.getObject(csvKey);

  // Get the current application state for the import
  const { data: currentApplicationState } = await applicationState.get('supported-sources-import');

  if (ETag === currentApplicationState.etag) {
    logger.info('No change detected. Not processing file.');
    return 'No change detected. Not processing file.';
  }

  const arraysFromCSV = await csvParse(Body, { columns: true });
  for (let i = 0; i < arraysFromCSV.length; i++) {
    const mappedSupportedSource = supportedSourcesMapper.csvToModel(arraysFromCSV[i]);
    const supportedSourceExists = await supportedSourcesRepo.findOneByReference(mappedSupportedSource.reference);

    const keys = ['name'];

    if (supportedSourceExists) {
      if (!isEqual(pick(supportedSourceExists, keys), pick(mappedSupportedSource, keys))) {
        logger.info(`Updating an existing supported source: ${mappedSupportedSource.reference}`);
        await supportedSourcesRepo.updateByReference(mappedSupportedSource.reference, mappedSupportedSource);
      }
    } else {
      logger.info(`Creating a new supported source: ${mappedSupportedSource.reference}`);
      await supportedSourcesRepo.create(mappedSupportedSource);
    }
  }

  return applicationState.save('supported-sources-import', { etag: ETag });
};

const onFailedHandler = async (job, err) => {
  logger.error(`${JOB_NAME}: Job has failed`, err);
};

const onComplete = async () => {
  logger.info(`${JOB_NAME}: Job has completed`);
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handler;
exports.onFailed = onFailedHandler;
exports.onComplete = onComplete;
exports.hasScheduler = true;
