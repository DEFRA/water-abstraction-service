'use strict'

const { QueueScheduler, Worker } = require('bullmq')
const { logger } = require('../../logger')

class WorkerManager {
  constructor (connection) {
    this._connection = connection
    this._queues = new Map()
  }

  register (jobContainer, queueManager) {
    const { _connection: connection } = this

    queueManager.register(jobContainer)

    // Create worker with handler
    // TODO: Implement metrics so we can see how workers are doing. Add the following line to workerOpts and require
    // `MetricsTime` from bullmq
    // metrics: { maxDataPoints: MetricsTime.ONE_WEEK * 2 },
    const workerOptions = {
      ...(jobContainer.workerOptions || {}),
      connection
    }

    const worker = new Worker(jobContainer.jobName, jobContainer.handler, workerOptions)

    // Register onComplete handler if defined
    if (jobContainer.onComplete) {
      worker.on('completed', job => jobContainer.onComplete(job, queueManager))
    }

    // An onFailed handler must always be defined
    worker.on('failed', jobContainer.onFailed)

    // Create scheduler - this is only set up if the hasScheduler flag is set.
    // This is needed if the job makes use of Bull features such as retry/cron
    const queueScheduler = jobContainer.hasScheduler
      ? new QueueScheduler(jobContainer.jobName, { connection })
      : null

    // Register all the details in the map
    this._queues.set(jobContainer.jobName, {
      jobContainer,
      worker,
      queueScheduler
    })
  }

  async stop () {
    for (const [jobName, { worker }] of this._queues) {
      await this._closeWorker(jobName, worker)
    }
  }

  async _closeWorker (jobName, worker) {
    try {
      await worker.close()
    } catch (err) {
      logger.error(`Error shutting down worker ${jobName}`, err.stack)
    }
  }
}

module.exports = WorkerManager
