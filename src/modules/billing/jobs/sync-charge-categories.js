// Syncs Charge Categories from CSV file stored on S3 bucket
'use strict';

// Dependencies
const { pick, isEqual } = require('lodash');
const moment = require('moment');
const BlueBirdPromise = require('bluebird');
const csvParse = BlueBirdPromise.promisify(require('csv-parse'));
const { logger } = require('../../../logger');
const s3Connector = require('../../../lib/services/s3');

// Constants
const JOB_NAME = 'billing.charge-categories.sync-from-csv';
const csvKey = 'billing-metadata/charge-categories.csv';

// Handy stuff
const config = require('../../../../config');
const applicationState = require('../../../lib/services/application-state');

// Charge Categories Repo
const chargeCategoriesRepo = require('../../../lib/connectors/repos/charge-categories');
const chargeCategoriesMapper = require('../../../lib/mappers/charge-category');

const createMessage = () => ([
  JOB_NAME,
  {},
  {
    jobId: `${JOB_NAME}.${moment().format('YYYYMMDD')}`,
    repeat: {
      every: config.import.chargeCategoriesSyncFrequencyInMS
    }
  }
]);

const handler = async () => {
  logger.info(`${JOB_NAME}: Job has started`);

  // Get the Body and the ETag of the S3 object
  const { Body, ETag } = await s3Connector.getObject(csvKey);

  // Get the current application state for the import
  const { data: currentApplicationState } = await applicationState.get('charge-categories-import');

  if (ETag === currentApplicationState.etag) {
    logger.info('No change detected. Not processing file.');
    return 'No change detected. Not processing file.';
  }

  const arraysFromCSV = await csvParse(Body, { columns: true });
  for (let i = 0; i < arraysFromCSV.length; i++) {
    const mappedChargeCategory = chargeCategoriesMapper.csvToModel(arraysFromCSV[i]);
    const chargeCategoryExists = await chargeCategoriesRepo.findOneByReference(mappedChargeCategory.reference);

    const keys = [
      'description',
      'shortDescription',
      'subsistenceCharge',
      'minVolume',
      'maxVolume',
      'isTidal',
      'lossFactor',
      'modelTier',
      'isRestrictedSource'
    ];

    if (chargeCategoryExists) {
      if (!isEqual(pick(chargeCategoryExists, keys), pick(mappedChargeCategory, keys))) {
        logger.info(`Updating an existing charge category: ${mappedChargeCategory.reference}`);
        await chargeCategoriesRepo.updateByReference(mappedChargeCategory.reference, mappedChargeCategory);
      }
    } else {
      logger.info(`Creating a new charge category: ${mappedChargeCategory.reference}`);
      await chargeCategoriesRepo.create(mappedChargeCategory);
    }
  }

  return applicationState.save('charge-categories-import', { etag: ETag });
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
