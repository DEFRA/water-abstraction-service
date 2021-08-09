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
const licenceGaugingStationsService = require('../../../lib/services/licence-gauging-stations-service');
const licencesService = require('../../../lib/services/licences');

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
    return licences.map(async eachLicence => {
      const edits = get(eachLicence, 'licence_data_value', {});
      if (edits.status === 'Approved') {
      // put it through the reducer
        // console.log(edits.actions.map(n => n.payload.data));
        console.log(edits.actions);
        const { payload: finalShape } = merge({}, ...edits.actions);

        const { max_rate: maxRate, max_rate_unit, gauging_station: GaugingStation } = finalShape.data;
        const maxRateUnit = max_rate_unit.replace('³', '3');
        const { id: gaugingStationId } = GaugingStation;
        // Look for the relevant sub-part of the object, if one exists
        if (maxRate && maxRateUnit && gaugingStationId) {
          const flowUnits = ['Ml/d', 'm3/s', 'm3/d', 'l/s'];
          const isFlowOrLevel = flowUnits.includes(maxRateUnit) ? 'flow' : 'level';

          // Check if an identical linkage already exists
          const licenceRecord = await licencesService.getLicenceByLicenceRef(eachLicence.licence_ref);

          /**
           * 2.1; 2.3; 2.5; 2.9.1;2.9.2;2.9.3; 2.9.4; 2.9.5; 2.9.6; 2.9.7; 2.9.8 are all Stop conditions
           *
           * 2.2; 2.4; 2.6 and 2.7 are reduce conditions.
           */
          const existingLinkage = await licenceGaugingStationsService.findLicenceGaugingStationsByFilter({
            licence_id: licenceRecord.id,
            gauging_station_id: gaugingStationId,
            restriction_type: isFlowOrLevel,
            threshold_unit: maxRateUnit,
            threshold_value: maxRate
          });

          if (existingLinkage.length === 0) {
            console.log('CREATING A LINKAGE');
            await licenceGaugingStationsService.createNewLicenceLink(gaugingStationId, licenceRecord.id, {
              licenceVersionPurposeConditionId: null, // Todo
              thresholdUnit: maxRateUnit,
              thresholdValue: maxRate,
              abstractionPeriod: null,
              restrictionType: isFlowOrLevel,
              alertType: 'reduce', // TODO
              source: 'digitse'
            });
          } else {
            console.log('LINKAGE ALREADY EXISTS');
          }

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
