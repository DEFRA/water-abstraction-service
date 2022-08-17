'use strict'

const { Queue, QueueScheduler, Worker } = require('bullmq')
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

    logger.info(`Registering job: ${jobContainer.jobName}`)

    // Create queue
    const queue = new Queue(jobContainer.jobName, { connection })

    const workerAndQueueScheduler = this._createWorkerAndQueueScheduler(jobContainer, connection)

    // Register all the details in the map
    this._queues.set(jobContainer.jobName, {
      jobContainer,
      queue,
      ...workerAndQueueScheduler
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
      if (!worker) {
        continue
      }

      try {
        await worker.close()
      } catch (err) {
        logger.error(`Error shutting down worker ${jobName}`, err.stack)
      }
    }
  }

  _createWorkerAndQueueScheduler (jobContainer, connection) {
    const result = {}

    if (process.env.name !== 'service-background') {
      return result
    }
    // Create worker with handler
    // TODO: Implement metrics so we can see how workers are doing. Add the following line to workerOpts and require
    // `MetricsTime` from bullmq
    // metrics: { maxDataPoints: MetricsTime.ONE_WEEK * 2 },
    const workerOptions = {
      ...(jobContainer.workerOptions || {}),
      connection
    }

    result.worker = new Worker(jobContainer.jobName, jobContainer.handler, workerOptions)

    // Register onComplete handler if defined
    if (jobContainer.onComplete) {
      result.worker.on('completed', job => jobContainer.onComplete(job, this))
    }

    // An onFailed handler must always be defined
    result.worker.on('failed', jobContainer.onFailed)

    // Create scheduler - this is only set up if the hasScheduler flag is set.
    // This is needed if the job makes use of Bull features such as retry/cron
    result.scheduler = jobContainer.hasScheduler
      ? new QueueScheduler(jobContainer.jobName, { connection })
      : null

    return result
  }
}

module.exports = QueueManager
