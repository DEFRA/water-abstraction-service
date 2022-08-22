// Syncs gauging stations from CSV on S3
'use strict'

// Dependencies
const moment = require('moment')
const Promise = require('bluebird')
const csvParse = Promise.promisify(require('csv-parse'))
const { logger } = require('../../../logger')
const s3Connector = require('../../../lib/services/s3')

// Constants
const JOB_NAME = 'gauging-stations.sync-from-csv'
const csvKey = 'gauging-stations/gauging-stations.csv'

// Handy stuff
const config = require('../../../../config')
const helpers = require('../helpers')
const applicationState = require('../../../lib/services/application-state')

// Gauging Stations Repo
const gaugingStationsRepo = require('../../../lib/connectors/repos/gauging-stations')
const gaugingStationMapper = require('../../../lib/mappers/gauging-station')

const createMessage = () => ([
  JOB_NAME,
  {},
  {
    jobId: `${JOB_NAME}.${moment().format('YYYYMMDD')}`,
    repeat: {
      every: config.import.gaugingStationsSyncFrequencyInMS
    }
  }
])

const handler = async () => {
  logger.info(`${JOB_NAME}: Job has started`)

  // Get the Body and the ETag of the S3 object
  const { Body, ETag } = await s3Connector.getObject(csvKey)

  // Get the current application state for the import
  const { data: currentApplicationState } = await applicationState.get('gauging-stations-import')

  if (ETag === currentApplicationState.etag) {
    logger.info('No change detected. Not processing file.')
    return 'No change detected. Not processing file.'
  }

  const arraysFromCSV = await csvParse(Body, { columns: true })

  const gaugingStationsInDb = await gaugingStationsRepo.findAll()

  for (let i = 0; i < arraysFromCSV.length; i++) {
    const mappedGaugingStation = gaugingStationMapper.csvToModel(arraysFromCSV[i])
    const gaugingStationForUpdate = helpers.getGaugingStationForUpdate(mappedGaugingStation, gaugingStationsInDb)

    if (gaugingStationForUpdate) {
      await gaugingStationsRepo.update(gaugingStationForUpdate, mappedGaugingStation)
    } else {
      await gaugingStationsRepo.create(mappedGaugingStation)
    }
  }

  return applicationState.save('gauging-stations-import', { etag: ETag })
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
