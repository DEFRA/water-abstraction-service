'use strict'

const moment = require('moment')

const config = require('../../../../config')
const licenceVersions = require('../../../lib/connectors/repos/licence-versions')
const { logger } = require('../../../logger')

const { jobName: CREATE_CHARGE_VERSION_JOB_NAME } = require('./create-charge-version-workflows')
const JOB_NAME = 'licence-not-in-charge-version-workflow'

const createMessage = () => ([
  JOB_NAME,
  {},
  {
    repeat: {
      cron: config.jobs.chargeVersionWorkflow
    }
  }
])

const handler = async (job) => {
  logger.info(`Handling job ${job.name} ${job.id}`)

  const results = await licenceVersions.findIdsByDateNotInChargeVersionWorkflows(moment().add(-2, 'month').toISOString())

  logger.info(`Job ${job.name} got ${results.length} results`)

  return results
}

const onComplete = async (job, queueManager) => {
  logger.info(`Completing job ${job.name} ${job.id}`)

  if (job.returnvalue) {
    job.returnvalue.forEach(licenceIds => {
      queueManager.add(CREATE_CHARGE_VERSION_JOB_NAME, licenceIds.licenceVersionId, licenceIds.licenceId)
    })
  }
}

const onFailed = (job, err) => {
  logger.error(`Job ${job.name} ${job.id} failed`, err)
}

exports.jobName = JOB_NAME
exports.createMessage = createMessage
exports.handler = handler
exports.onComplete = onComplete
exports.onFailed = onFailed
exports.hasScheduler = true
exports.startClean = true
