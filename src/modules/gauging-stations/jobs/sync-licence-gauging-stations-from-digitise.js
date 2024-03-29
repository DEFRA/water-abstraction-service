// Syncs licence gauging station linkages from Digitise data with the into `water.licence_gauging_stations`
'use strict'

// Dependencies
const moment = require('moment')
const { logger } = require('../../../logger')
const permitConnector = require('../../../lib/connectors/permit')
const { digitise } = require('@envage/water-abstraction-helpers')
// Constants
const JOB_NAME = 'gauging-stations.copy-licence-gauging-stations-from-digitise'

// Handy stuff
const config = require('../../../../config')
const licenceGaugingStationsService = require('../../../lib/services/licence-gauging-stations-service')
const licenceVersionPurposeConditionsService = require('../../../lib/services/licence-version-purpose-conditions')
const licencesService = require('../../../lib/services/licences')

const createMessage = () => ([
  JOB_NAME,
  {},
  {
    jobId: `${JOB_NAME}.${moment().format('YYYYMMDD')}`,
    repeat: {
      cron: config.import.digitiseToLicenceGaugingStationsCronExp
    }
  }
])

const handler = async () => {
  logger.info(`${JOB_NAME}: Job has started`)

  // Find out which licences need to be processed
  // Call the permit repo, and fetch any licence refs plus licence_data_value
  // where permit.licence.date_licence_version_purpose_conditions_last_copied is either null or before today
  const licences = await permitConnector.licences.getWaterLicencesThatHaveGaugingStationLinkagesThatNeedToBeCopiedFromDigitise()

  logger.info(`Found ${licences.length} candidate licences that have licence gauging station linkages that may be copied from digitise...`)
  // Iterate through each licence's licence_data_value column.
  return licences.map(async eachLicence => {
    logger.info(`Processing ${eachLicence.licence_ref}...`)
    const edits = eachLicence.licence_data_value ?? {}
    if (edits.status === 'Approved') {
      logger.info(`Processing ${eachLicence.licence_ref}: Status is approved...`)
      // Take the permit data, and put it through the Digitise reducer
      const originalLicence = await permitConnector.licences.getWaterLicence(eachLicence.licence_ref)
      const initialState = originalLicence && digitise.getInitialState(originalLicence)
      const hasData = initialState.licence.data.current_version !== undefined
      if (hasData) {
        const finalState = digitise.stateManager(initialState, edits.actions)
        const { licence } = finalState
        const { arData } = licence
        if (licence && arData) {
          arData.map(async eachArSegment => {
            const thisSchema = eachArSegment.schema

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
            ]
            const reduceAbstractionConditionSchema = [
              '/wr22/2.2',
              '/wr22/2.4',
              '/wr22/2.6',
              '/wr22/2.7'
            ]

            let alertType
            if (stopAbstractionConditionSchema.includes(thisSchema)) {
              alertType = 'stop'
            } else if (reduceAbstractionConditionSchema.includes(thisSchema)) {
              alertType = 'reduce'
            }

            const licenceVersionPurposeConditionURI = eachArSegment.content.nald_condition.id ?? null
            if (licenceVersionPurposeConditionURI) {
              const parts = licenceVersionPurposeConditionURI.split('/')
              const licenceVersionPurposeConditionLegacyId = `${parts[parts.length - 1]}:${parts[parts.length - 2]}`
              const { licenceVersionPurposeConditionId } = await licenceVersionPurposeConditionsService.getLicenceVersionConditionByPartialExternalId(licenceVersionPurposeConditionLegacyId)
              const unit = eachArSegment.content.unit ?? null
              const maxRateUnit = eachArSegment.content.max_rate_unit ?? ''
              const unparsedThresholdUnit = unit ?? maxRateUnit
              const thresholdUnit = unparsedThresholdUnit.replace('³', '3')

              const maxRate = eachArSegment.content.max_rate ?? null
              const holRateLevel = eachArSegment.content.hol_rate_level ?? null
              const thresholdValue = maxRate ?? holRateLevel

              const flowUnits = ['Ml/d', 'm3/s', 'm3/d', 'l/s']
              const restrictionType = flowUnits.includes(thresholdUnit) ? 'flow' : 'level'
              const gaugingStationId = eachArSegment.content.gauging_station.id ?? null
              const source = 'digitise'
              if (thresholdUnit && thresholdValue && gaugingStationId && eachLicence.licence_ref && licenceVersionPurposeConditionId) {
                const licenceRecord = await licencesService.getLicenceByLicenceRef(eachLicence.licence_ref)
                const existingLinkage = await licenceGaugingStationsService.findLicenceGaugingStationsByFilter({
                  licence_id: licenceRecord.id,
                  gauging_station_id: gaugingStationId,
                  restriction_type: restrictionType,
                  threshold_unit: thresholdUnit,
                  threshold_value: thresholdValue
                })

                if (existingLinkage.length > 0) {
                  logger.info(`Linkage already exists between ${eachLicence.licence_ref} and ${gaugingStationId} at ${thresholdValue} ${thresholdUnit} - Skipping.`)
                } else {
                  logger.info(`New linkage detected between ${eachLicence.licence_ref} and ${gaugingStationId} at ${thresholdValue} ${thresholdUnit} - Copying to water.licence_gauging_stations.`)
                  await licenceGaugingStationsService.createNewLicenceLink(gaugingStationId, licenceRecord.id, {
                    licenceVersionPurposeConditionId,
                    thresholdUnit,
                    thresholdValue,
                    restrictionType,
                    alertType,
                    source
                  })
                  logger.info(`New linkage created between ${eachLicence.licence_ref} and ${gaugingStationId} at ${thresholdValue} ${thresholdUnit}`)
                }
              } else {
                logger.info(`Attempted to copy Digitise record relating to ${eachLicence.licence_ref}. This operation failed due to incomplete data.`)
              }
              // For the successful records,
              // mark them as processed by updating the datestamp
              // in permit.licence.date_licence_version_purpose_conditions_last_copied
              await permitConnector.licences.updateOne(eachLicence.licence_id, {
                date_gauging_station_links_last_copied: new Date()
              })
            }
          })
        }
      }
    } else {
      logger.info(`Processing ${eachLicence.licence_ref}: Status is not approved - skipping...`)
    }
  })
}

const onFailedHandler = async (job, err) => {
  logger.error(`${JOB_NAME}: Job has failed`, err.stack)
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
