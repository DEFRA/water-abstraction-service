// Syncs licence conditions from Digitise data with the into `water.licence_version_purpose_conditions`
'use strict'

// Dependencies
const moment = require('moment')
const { get } = require('lodash')
const { logger } = require('../../../logger')
const permitConnector = require('../../../lib/connectors/permit')
const { digitise } = require('@envage/water-abstraction-helpers')
const { getDigitiseText } = require('../helpers')
// Constants
const JOB_NAME = 'gauging-stations.copy-lvpc-from-digitise'

// Handy stuff
const config = require('../../../../config')
const licenceVersionPurposeConditionsService = require('../../../lib/services/licence-version-purpose-conditions')

const createMessage = () => ([
  JOB_NAME,
  {},
  {
    jobId: `${JOB_NAME}.${moment().format('YYYYMMDD')}`,
    repeat: {
      cron: config.import.digitiseToLVPCSyncCronExp
    }
  }
])

const handler = async () => {
  logger.info(`${JOB_NAME}: Job has started`)

  logger.info(`${JOB_NAME}: Job has started`)

  // Find out which licences need to be processed
  // Call the permit repo, and fetch any licence refs plus licence_data_value
  // where permit.licence.date_licence_version_purpose_conditions_last_copied is either null or before today
  const licences = await permitConnector.licences.getWaterLicencesThatHaveConditionsThatNeedToBeCopiedFromDigitise()

  logger.info(`Found ${licences.length} candidate licences that have licence version purpose conditions that may be copied from digitise...`)

  // Iterate through each licence's licence_data_value column.
  return licences.map(async eachLicence => {
    logger.info(`Processing ${eachLicence.licence_ref}...`)
    const edits = get(eachLicence, 'licence_data_value', {})
    if (edits.status === 'Approved') {
      logger.info(`Processing ${eachLicence.licence_ref}: Status is approved...`)
      // Take the permit data, and put it through the Digitise reducer
      const originalLicence = await permitConnector.licences.getWaterLicence(eachLicence.licence_ref)
      const initialState = originalLicence && digitise.getInitialState(originalLicence)
      const hasData = get(initialState, 'licence.data.current_version') !== undefined
      if (hasData) {
        const finalState = digitise.stateManager(initialState, edits.actions)
        const { licence } = finalState
        const { arData } = licence
        if (licence && arData) {
          arData.map(async eachArSegment => {
            const thisSchema = eachArSegment.schema
            const licenceVersionPurposeConditionURI = get(eachArSegment, 'content.nald_condition.id', null)
            const parts = licenceVersionPurposeConditionURI.split('/')
            const licenceVersionPurposeConditionLegacyId = `${parts[parts.length - 1]}:${parts[parts.length - 2]}`
            const {
              licenceVersionPurposeConditionId,
              licenceVersionPurposeId
            } = await licenceVersionPurposeConditionsService.getLicenceVersionConditionByPartialExternalId(licenceVersionPurposeConditionLegacyId)
            const licenceVersionPurposeConditionTypeId = await licenceVersionPurposeConditionsService.getLicenceVersionConditionType(licenceVersionPurposeConditionId)
            const notes = getDigitiseText(thisSchema, eachArSegment.content).replace(/\n/g, ' ')
            const externalId = `digitise:${eachLicence.licence_id}:${licenceVersionPurposeConditionId}:${thisSchema}`

            // Upsert the record
            licenceVersionPurposeConditionsService.upsertByExternalId(externalId, licenceVersionPurposeId, licenceVersionPurposeConditionTypeId, notes, 'digitise')

            // For the successful records,
            // mark them as processed by updating the datestamp
            // in permit.licence.date_licence_version_purpose_conditions_last_copied

            await permitConnector.licences.updateOne(eachLicence.licence_id, {
              date_licence_version_purpose_conditions_last_copied: new Date()
            })
          })
        }
      }
    } else {
      logger.info(`Processing ${eachLicence.licence_ref}: Status is not approved - skipping...`)
    }
  })
}

const onFailedHandler = async (job, err) => {
  logger.error(`${JOB_NAME}: Job has failed`, err)
}

const onComplete = async () => {
  logger.info(`${JOB_NAME}: Job has completed`)
}

exports.jobName = JOB_NAME
exports.createMessage = createMessage
exports.handler = handler
exports.startClean = true
exports.onFailed = onFailedHandler
exports.onComplete = onComplete
exports.hasScheduler = true
