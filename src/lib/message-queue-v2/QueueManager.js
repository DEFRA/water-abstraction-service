'use strict'

const bull = require('bullmq')
const { logger } = require('../../logger')
const backgoundConnector = require('../connectors/background')

const STATUS_COMPLETED = 'completed'
const STATUS_FAILED = 'failed'

const jobDefaults = {
  removeOnComplete: true,
  removeOnFail: 500
}

const closeWorker = async (jobName, worker) => {
  try {
    await worker.close()
  } catch (err) {
    logger.error(`Error shutting down worker ${jobName}`, err)
  }
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

    // Create worker with handler
    const workerOpts = {
      ...(jobContainer.workerOptions || {}),
      connection
    }

    logger.info(`Registering job: ${jobContainer.jobName}`)

    backgoundConnector.registerWorker(jobContainer.jobName)
    const worker = new bull.Worker(jobContainer.jobName, jobContainer.handler, workerOpts)

    // Create scheduler - this is only set up if the hasScheduler flag is set.
    // This is needed if the job makes use of Bull features such as retry/cron
    const scheduler = jobContainer.hasScheduler
      ? new bull.QueueScheduler(jobContainer.jobName, { connection })
      : null

    // Register onComplete handler if defined
    if (jobContainer.onComplete) {
      worker.on(STATUS_COMPLETED, job => jobContainer.onComplete(job, this))
    }
    // An onFailed handler must always be defined
    worker.on(STATUS_FAILED, jobContainer.onFailed)

    // Register all the details in the map
    this._queues.set(jobContainer.jobName, {
      jobContainer,
      queue,
      worker,
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

  /**
   * Shuts down all registered workers
   */
  async stop () {
    for (const [jobName, { worker }] of this._queues) {
      await closeWorker(jobName, worker)
    }
  }
}

module.exports = QueueManager
module.exports.STATUS_COMPLETED = STATUS_COMPLETED
module.exports.STATUS_FAILED = STATUS_FAILED
