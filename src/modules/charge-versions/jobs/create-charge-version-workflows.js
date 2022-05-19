'use strict'

const { get } = require('lodash')
const JOB_NAME = 'new-LicenceVersion'
const chargeVersionWorkflowService = require('../services/charge-version-workflows')
const { logger } = require('../../../logger')
const licences = require('../../../lib/services/licences')
const { CHARGE_VERSION_WORKFLOW_STATUS } = require('../../../lib/models/charge-version-workflow')
const createMessage = (licenceVersionId, licenceId) => {
  return [
    JOB_NAME,
    { licenceVersionId, licenceId },
    {
      jobId: `${JOB_NAME}.${licenceVersionId}`,
      attempts: 6,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    }
  ]
}

const handler = async job => {
  logger.info(`Handling: ${job.id}`)
  const licenceVersionId = get(job, 'data.licenceVersionId')
  const licenceId = get(job, 'data.licenceId')

  try {
    const licence = await licences.getLicenceById(licenceId)
    const chargeVersionWorkflow = await chargeVersionWorkflowService.create(licence, null, null, CHARGE_VERSION_WORKFLOW_STATUS.toSetup, licenceVersionId)
    return { chargeVersionWorkflowId: chargeVersionWorkflow.id }
  } catch (err) {
    logger.error(`Error handling: ${job.id}`, err, job.data)
    throw err
  }
}

const onFailed = (job, err) => {
  logger.error(`Job ${job.name} ${job.id} failed`, err)
}

exports.handler = handler
exports.onFailed = onFailed
exports.jobName = JOB_NAME
exports.createMessage = createMessage
