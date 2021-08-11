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
        const licenceVersionPurposeConditionURI = get(eachArSegment, 'content.nald_condition.id', null);
        const parts = licenceVersionPurposeConditionURI.split('/');
        const licenceVersionPurposeConditionLegacyId = `${parts[parts.length - 1]}:${parts[parts.length - 2]}`;
        const licenceVersionPurposeConditionId = await licenceVersionPurposeConditionsService.getLicenceVersionConditionByPartialExternalId(licenceVersionPurposeConditionLegacyId);
        const licenceVersionPurposeConditionTypeId = await licenceVersionPurposeConditionsService.getLicenceVersionConditionType(licenceVersionPurposeConditionId);
        const notes = getDigitiseText();
        const externalId = `digitise:${eachLicence.licence_id}:${eachLicence.licence_ref}`;

        console.log({
          licenceVersionPurposeConditionId,
          licenceVersionPurposeConditionTypeId,
          notes,
          externalId
        });
        // For the successful records,
        // mark them as processed by updating the datestamp
        // in permit.licence.date_licence_version_purpose_conditions_last_copied
        /*
        await permitConnector.licences.updateOne(eachLicence.licence_id, {
          date_licence_version_purpose_conditions_last_copied: new Date()
        });
         */
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
