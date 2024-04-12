'use strict'

const { logger } = require('../../../../logger')
const config = require('../../../../../config')
const queries = require('../queries')
const eventHelpers = require('../event-helpers')

const JOB_NAME = 'notifications.refreshEvent'

const createMessage = () => {
  logger.info(`Create Message ${JOB_NAME}`)
  return [
    JOB_NAME,
    {},
    {
      jobId: JOB_NAME,
      repeat: {
        every: config.jobs.batchNotifications.requestEvent
      }
    }
  ]
}

const handleRefreshEvent = async eventId => {
  try {
    logger.info(`Refreshing notify message event: ${eventId}`)

    await eventHelpers.refreshEventStatus(eventId)
  } catch (err) {
    logger.error('Error refreshing batch message event', err.stack, { eventId })
  }
}

const handler = async job => {
  try {
    const batch = await queries.getSendingEvents()

    if (batch.length > 0) {
      logger.info(`Refreshing notify message events - ${batch.length} item(s) found`)
    }

    await Promise.all((batch.map(({ event_id: id }) => handleRefreshEvent(id))))
  } catch (err) {
    logger.error(`Error handling: ${job.id}`, err.stack)
  }
}

const onFailed = async (job, err) => {
  logger.error(`${JOB_NAME}: Job has failed`, err.stack)
}

exports.handler = handler
exports.onFailed = onFailed
exports.jobName = JOB_NAME
exports.createMessage = createMessage
exports.hasScheduler = true
