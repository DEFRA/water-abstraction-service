const { logger } = require('../../../logger')
const send = require('../lib/send')
const notify = require('../../notify')

const JOB_NAME = 'returnsNotification.send'

/**
 * Creates a message for Bull MQ
 * @param {Object} data containing message data options
 * @returns {Object}
 */
const createMessage = data => {
  logger.info(`Create Message ${JOB_NAME}`)
  return [
    JOB_NAME,
    data,
    {
      jobId: `${JOB_NAME}`
    }
  ]
}

const handleReturnsNotificationSend = async job => {
  logger.info(`Handling: ${JOB_NAME}:${job.id}`)
}

const onComplete = async (job, queueManager) => {
  const options = await send.prepareMessageData(job.data)
  await notify.enqueue(queueManager, options)
  logger.info(`${JOB_NAME}: Job has completed`)
}

const onFailed = async (job, err) => logger.error(`${JOB_NAME}: Job has failed`, err)

exports.createMessage = createMessage
exports.handler = handleReturnsNotificationSend
exports.onFailed = onFailed
exports.onComplete = onComplete
exports.jobName = JOB_NAME
