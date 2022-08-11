'use strict'

const bull = require('bullmq')
const { logger } = require('../../logger')

const jobDefaults = {
  removeOnComplete: true,
  removeOnFail: 500
}

class QueueManager {
  constructor (connection) {
    this._connection = connection
    this._queues = new Map()
  }

  /**
   * Adds a job to the queue with the requested name
   * @param {String} jobName
   * @param  {...any} args
   */
  add (jobName, ...args) {
    logger.info(`Attempting to queue a BullMQ job: ${jobName}`)
    const queueContainer = this._queues.get(jobName)
    const { createMessage } = queueContainer.jobContainer
    const [name, data, options] = createMessage(...args)

    return queueContainer.queue.add(name, data, {
      ...jobDefaults,
      ...options
    })
  }

  /**
   * Registers a job container
   * @param {Object} jobContainer
   * @param {String} jobContainer.jobName - the job/queue name
   * @param {Function} jobContainer.handler - the handler for the job
   * @param {Boolean} jobContainer.hasScheduler - whether a scheduler is needed - for jobs with retry etc
   * @param {Function} jobContainer.onComplete - on complete handler, called with (job, queueManager)
   * @param {Function} jobContainer.onFailed - on failed handler
   * @param {Object} [jobContainer.workerOptions] - options to pass to the worker constructor
   */
  register (jobContainer) {
    const { _connection: connection } = this

    // Create queue
    const queue = new bull.Queue(jobContainer.jobName, { connection })

    logger.info(`Registering job: ${jobContainer.jobName}`)

    // Create scheduler - this is only set up if the hasScheduler flag is set.
    // This is needed if the job makes use of Bull features such as retry/cron
    const scheduler = jobContainer.hasScheduler
      ? new bull.QueueScheduler(jobContainer.jobName, { connection })
      : null

    // Register all the details in the map
    this._queues.set(jobContainer.jobName, {
      jobContainer,
      queue,
      scheduler
    })

    return this
  }

  deleteKeysByPattern (pattern) {
    const { _connection: connection } = this

    return new Promise((resolve, reject) => {
      const stream = connection.scanStream({
        match: pattern
      })
      stream.on('data', keys => {
        if (keys.length) {
          const pipeline = connection.pipeline()
          keys.forEach(key => {
            pipeline.del(key)
          })
          pipeline.exec()
        }
      })
      stream.on('end', () => {
        resolve()
      })
      stream.on('error', e => {
        reject(e)
      })
    })
  }
}

module.exports = QueueManager
