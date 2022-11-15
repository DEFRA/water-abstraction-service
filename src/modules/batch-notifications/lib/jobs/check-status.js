'use strict'

const { logger } = require('../../../../logger')
const { getNextCheckTime, getNextCheckCount } = require('../status-check-helpers')
const messageHelpers = require('../message-helpers')
const notify = require('../../../../lib/notify')
const scheduledNotifications = require('../../../../controllers/notifications')
const config = require('../../../../../config')
const queries = require('../queries')

const JOB_NAME = 'notifications.checkStatus'

const createMessage = () => {
  logger.info(`Create Message ${JOB_NAME}`)
  return [
    JOB_NAME,
    {},
    {
      jobId: JOB_NAME,
      repeat: {
        every: config.jobs.batchNotifications.checkStatus
      }
    }
  ]
}

const handleCheckStatus = async messageId => {
  try {
    logger.info(`Checking status of message: ${messageId}`)

    // Load scheduled_notification message data
    const message = await messageHelpers.getMessageById(messageId)

    // Check message status from notify
    const status = await notify.getStatus(message.notify_id)

    // Update scheduled_notification with the next status check timestamp,
    // the number of status checks now performed, and the status retrieved
    // from the Notify API call
    const data = {
      next_status_check: getNextCheckTime(message),
      status_checks: getNextCheckCount(message),
      notify_status: status
    }

    await scheduledNotifications.repository.update({ id: messageId }, data)
  } catch (err) {
    logger.error('Error checking notify status', err.stack, { messageId })
  }
}

const handler = async job => {
  logger.info(`Handling: ${JOB_NAME}:${job.id}`)
  try {
    const batch = await queries.getNotifyStatusChecks()
    logger.info(`Checking notify statuses - ${batch.length} item(s) found`)
    await Promise.all((batch.map(({ id }) => handleCheckStatus(id))))
  } catch (err) {
    logger.error(`Error handling: ${job.id}`, err.stack, job.data)
  }
}

const onFailed = async (job, err) => {
  logger.error(`${JOB_NAME}: Job has failed`, err.stack)
}

const onComplete = async () => {
  logger.info(`${JOB_NAME}: Job has completed`)
}

exports.handler = handler
exports.onFailed = onFailed
exports.onComplete = onComplete
exports.jobName = JOB_NAME
exports.createMessage = createMessage
exports.hasScheduler = true
