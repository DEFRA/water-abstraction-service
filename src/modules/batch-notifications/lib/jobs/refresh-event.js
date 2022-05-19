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
    await eventHelpers.refreshEventStatus(eventId)
  } catch (err) {
    logger.error('Error refreshing batch message event', err, { eventId })
  }
}

const handler = async job => {
  logger.info(`Handling: ${JOB_NAME}:${job.id}`)
  try {
    const batch = await queries.getSendingEvents()
    logger.info(`Refreshing notify message events - ${batch.length} item(s) found`)
    await Promise.all((batch.map(({ event_id: id }) => handleRefreshEvent(id))))
  } catch (err) {
    logger.error(`Error handling: ${job.id}`, err)
  }
}

const onFailed = async (job, err) => {
  logger.error(`${JOB_NAME}: Job has failed`, err)
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
