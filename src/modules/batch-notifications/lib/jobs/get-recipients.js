'use strict'

const { get } = require('lodash')
const batchNotifications = require('../batch-notifications')
const { logger } = require('../../../../logger')
const eventsService = require('../../../../lib/services/events')
const { EVENT_STATUS_ERROR } = require('../event-statuses')

const JOB_NAME = 'notifications.getRecipients'

const createMessage = eventId => {
  logger.info(`Create Message ${JOB_NAME}`)
  return [
    JOB_NAME,
    { eventId },
    {
      jobId: `${JOB_NAME}.${eventId}`
    }
  ]
}

const handleGetRecipients = async job => {
  logger.info(`Handling: ${JOB_NAME}:${job.id}`)
  const eventId = get(job, 'data.eventId')
  try {
    const data = await batchNotifications.loadJobData(eventId)

    // Use config.getRecipients to get recipient list for this notification
    await data.config.getRecipients(data)
  } catch (err) {
    logger.error('Batch notifications handleGetRecipients error', err.stack, { eventId })
    await eventsService.updateStatus(eventId, EVENT_STATUS_ERROR)
  }
}

const onFailed = async (job, err) => {
  logger.error(`${JOB_NAME}: Job has failed`, err.stack)
}

const onComplete = async () => {
  logger.info(`${JOB_NAME}: Job has completed`)
}

exports.handler = handleGetRecipients
exports.onFailed = onFailed
exports.onComplete = onComplete
exports.jobName = JOB_NAME
exports.createMessage = createMessage
