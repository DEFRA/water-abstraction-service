'use strict'

const cron = require('node-cron')
const { logger } = require('../../logger')
const licenceVersions = require('../../lib/connectors/repos/licence-versions')
const moment = require('moment')
const createChargeVersionWorkflows = require('./jobs/create-charge-version-workflows')
const bluebird = require('bluebird')

const addJobToQueue = queueManager => async licenceVersion => {
  await queueManager.add(createChargeVersionWorkflows.jobName, licenceVersion.licenceVersionId, licenceVersion.licenceId)
}

const publishJobs = async queueManager => {
  const batch = await licenceVersions.findIdsByDateNotInChargeVersionWorkflows(moment().add(-2, 'month').toISOString())
  logger.info(`Creating charge version workflow batch - ${batch.length} item(s) found`)
  return bluebird.map(batch, addJobToQueue(queueManager))
}

const registerSubscribers = async server => {
  server.queueManager.register(createChargeVersionWorkflows)
  if (!process.env.TRAVIS) {
    cron.schedule('0 */6 * * *', () => publishJobs(server.queueManager))
  }
}

exports.plugin = {
  name: 'charge-version-workflow-jobs',
  dependencies: ['hapiBull'],
  register: registerSubscribers
}

// exporting for testing
module.exports.publishJobs = publishJobs
