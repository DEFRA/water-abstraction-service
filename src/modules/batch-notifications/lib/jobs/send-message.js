'use strict'

const { logger } = require('../../../../logger')
const messageHelpers = require('../message-helpers')
const notify = require('../notify-connector')
const scheduledNotificationService = require('../../../../lib/services/scheduled-notifications')
const licenceGaugingStationConnector = require('../../../../lib/connectors/repos/licence-gauging-stations')
const config = require('../../../../../config')
const queries = require('../queries')

const JOB_NAME = 'notifications.sendMessage'

const createMessage = () => {
  logger.info(`Create Message ${JOB_NAME}`)
  return [
    JOB_NAME,
    {},
    {
      jobId: JOB_NAME,
      repeat: {
        every: config.jobs.batchNotifications.sendMessages
      }
    }
  ]
}

const handleSendMessage = async messageId => {
  logger.info(`Sending notification message: ${messageId}`)

  try {
    const scheduledNotification = await scheduledNotificationService.getScheduledNotificationById(messageId)
    if (scheduledNotification.messageRef.indexOf('water_abstraction_alert') > -1) {
      // If this is a water abstraction alert, update the linkage record
      await licenceGaugingStationConnector.updateStatus(
        scheduledNotification.personalisation.licenceGaugingStationId,
        scheduledNotification.personalisation.sending_alert_type
      )
    }
    const notifyResponse = await notify.send(scheduledNotification)
    await scheduledNotificationService.updateScheduledNotificationWithNotifyResponse(messageId, notifyResponse)
  } catch (err) {
    logger.error('Error sending batch message', err.stack, { messageId })
    await messageHelpers.markMessageAsErrored(messageId, err)
  }
}

const handler = async job => {
  logger.info(`Handling: ${JOB_NAME}:${job.id}`)
  try {
    const batch = await queries.getSendingMessageBatch()
    logger.info(`Sending notify messages - ${batch.length} item(s) found`)
    await Promise.all((batch.map(({ id }) => handleSendMessage(id))))
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
