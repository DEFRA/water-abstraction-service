// Syncs licence conditions from Digitise data with the into `water.licence_version_purpose_conditions`
'use strict';

// Dependencies
const moment = require('moment');
const { get } = require('lodash');
const { logger } = require('../../../logger');
const permitConnector = require('../../../lib/connectors/permit');
const { digitise } = require('@envage/water-abstraction-helpers');
// Constants
const JOB_NAME = 'gauging-stations.copy-lvpc-from-digitise';

// Handy stuff
const config = require('../../../../config');
const licenceGaugingStationsService = require('../../../lib/services/licence-gauging-stations-service');
const licenceVersionPurposeConditionsService = require('../../../lib/services/licence-version-purpose-conditions');
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
  logger.info(`${JOB_NAME}: Job has started`);

  logger.info(`${JOB_NAME}: Job has started`);

  // Find out which licences need to be processed
  // Call the permit repo, and fetch any licence refs plus licence_data_value
  // where permit.licence.date_licence_version_purpose_conditions_last_copied is either null or before today
  const licences = await permitConnector.licences.getWaterLicencesThatHaveConditionsThatNeedToBeCopiedFromDigitise();

  // Iterate through each licence's licence_data_value column.
  return licences.map(async eachLicence => {
    const edits = get(eachLicence, 'licence_data_value', {});
    if (edits.status === 'Approved') {
      // Take the permit data, and put it through the Digitise reducer
      const initialState = digitise.getInitialState(eachLicence);
      const finalState = digitise.stateManager(initialState, eachLicence.licence_data_value.actions);
      const { licence } = finalState;
      const { arData } = licence;

      arData.map(async eachArSegment => {
        const thisSchema = eachArSegment.schema;

        const stopAbstractionConditionSchema = [
          '/wr22/2.1',
          '/wr22/2.3',
          '/wr22/2.5',
          '/wr22/2.9.1',
          '/wr22/2.9.2',
          '/wr22/2.9.3',
          '/wr22/2.9.4',
          '/wr22/2.9.5',
          '/wr22/2.9.6',
          '/wr22/2.9.7',
          '/wr22/2.9.8'
        ];
        const reduceAbstractionConditionSchema = [
          '/wr22/2.2',
          '/wr22/2.4',
          '/wr22/2.6',
          '/wr22/2.7'
        ];

        let alertType;
        if (stopAbstractionConditionSchema.includes(thisSchema)) {
          alertType = 'stop';
        } else if (reduceAbstractionConditionSchema.includes(thisSchema)) {
          alertType = 'reduce';
        }

        const licenceVersionPurposeConditionURI = get(eachArSegment, 'content.nald_condition.id', null);
        const parts = licenceVersionPurposeConditionURI.split('/');
        const licenceVersionPurposeConditionLegacyId = `${parts[parts.length - 1]}:${parts[parts.length - 2]}`;
        const licenceVersionPurposeConditionId = await licenceVersionPurposeConditionsService.getLicenceVersionConditionByPartialExternalId(licenceVersionPurposeConditionLegacyId);
        const thresholdUnit = (get(eachArSegment, 'content.unit', null) || get(eachArSegment, 'content.max_rate_unit', null)).replace('³', '3');
        const thresholdValue = get(eachArSegment, 'content.max_rate', null) || get(eachArSegment, 'content.hol_rate_level', null);
        const flowUnits = ['Ml/d', 'm3/s', 'm3/d', 'l/s'];
        const restrictionType = flowUnits.includes(thresholdUnit) ? 'flow' : 'level';
        const gaugingStationId = get(eachArSegment, 'content.gauging_station.id', null);
        const source = 'digitise';
        if (thresholdUnit && thresholdValue && gaugingStationId && eachLicence.licence_ref && licenceVersionPurposeConditionId) {
          const licenceRecord = await licencesService.getLicenceByLicenceRef(eachLicence.licence_ref);
          const existingLinkage = await licenceGaugingStationsService.findLicenceGaugingStationsByFilter({
            licence_id: licenceRecord.id,
            gauging_station_id: gaugingStationId,
            restriction_type: restrictionType,
            threshold_unit: thresholdUnit,
            threshold_value: thresholdValue
          });
          if (existingLinkage) {
            logger.info(`Linkage already exists between ${eachLicence.licence_ref} and ${gaugingStationId} at ${thresholdValue} ${thresholdUnit} - Skipping.`);
          } else {
            logger.info(`New linkage detected between ${eachLicence.licence_ref} and ${gaugingStationId} at ${thresholdValue} ${thresholdUnit} - Copying to water.licence_gauging_stations.`);
            await licenceGaugingStationsService.createNewLicenceLink(gaugingStationId, licenceRecord.id, {
              licenceVersionPurposeConditionId,
              thresholdUnit,
              thresholdValue,
              restrictionType,
              alertType,
              source
            });
            logger.info(`New linkage created between ${eachLicence.licence_ref} and ${gaugingStationId} at ${thresholdValue} ${thresholdUnit}`);
          }
        } else {
          logger.info(`Attempted to copy Digitise record relating to ${eachLicence.licence_ref}. This operation failed due to incomplete data.`);
        }
        // For the successful records,
        // mark them as processed by updating the datestamp
        // in permit.licence.date_licence_version_purpose_conditions_last_copied
        await permitConnector.licences.updateOne(eachLicence.licence_id, {
          date_gauging_station_links_last_copied: new Date()
        });
      });
    }
  });
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
