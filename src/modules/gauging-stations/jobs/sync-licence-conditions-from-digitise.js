// Syncs licence conditions from Digitise data with the into `water.licence_version_purpose_conditions`
'use strict';

// Dependencies
const moment = require('moment');
const { get, merge } = require('lodash');
const { logger } = require('../../../logger');
const permitConnector = require('../../../lib/connectors/permit');
// Constants
const JOB_NAME = 'gauging-stations.copy-lvpc-from-digitise';

// Handy stuff
const config = require('../../../../config');

const createMessage = () => ([
  JOB_NAME,
  {},
  {
    jobId: `${JOB_NAME}.${moment().format('YYYYMMDD')}`,
    repeat: {
      every: config.import.digitiseToLVPCSyncFrequencyInMS
    }
  }
]);

const handler = async () => {
  try {
    logger.info(`${JOB_NAME}: Job has started`);

    // Find out which licences need to be processed
    // Call the permit repo, and fetch any licence refs plus licence_data_value
    // where permit.licence.date_licence_version_purpose_conditions_last_copied is either null or before today
    const licences = await permitConnector.licences.getWaterLicencesThatHaveConditionsThatNeedToBeCopiedFromDigitise();

    // Iterate through each licence's licence_data_value column.
    return licences.map(eachLicence => {
      const edits = get(eachLicence, 'licence_data_value', {});
      if (edits.status === 'Approved') {
      // put it through the reducer
        const { payload: finalShape } = merge({}, ...edits.actions);

        const { max_rate: maxRate, max_rate_unit: maxRateUnit, gauging_station: GaugingStation } = finalShape.data;
        const { id: gaugingStationId } = GaugingStation;
        // Look for the relevant sub-part of the object, if one exists
        if (maxRate && maxRateUnit && gaugingStationId) {
          console.log(finalShape.data);
          console.log(maxRate);
          console.log(maxRateUnit);
          console.log(gaugingStationId);
        // For the successful records,
        // mark them as processed by updating the datestamp
        // in permit.licence.date_licence_version_purpose_conditions_last_copied
        }
      }
    });

    // Collect the necessary data to complete the record in `water.licence_version_purpose_conditions`
  } catch (e) {
    throw e;
  }
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
