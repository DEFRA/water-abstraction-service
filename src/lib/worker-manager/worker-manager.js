'use strict'

const { MetricsTime, Worker } = require('bullmq')
const { logger } = require('../../logger')

const closeWorker = async (jobName, worker) => {
  try {
    await worker.close()
  } catch (err) {
    logger.error(`Error shutting down worker ${jobName}`, err)
  }
}

class WorkerManager {
  constructor (connection) {
    this._connection = connection
    this._queues = new Map()
  }

  register (jobContainer) {
    const { _connection: connection } = this

    // Create worker with handler
    const workerOpts = {
      metrics: { maxDataPoints: MetricsTime.ONE_WEEK * 2 },
      ...(jobContainer.workerOptions || {}),
      connection
    }

    const worker = new Worker(jobContainer.jobName, jobContainer.handler, workerOpts)

    // Register onComplete handler if defined
    if (jobContainer.onComplete) {
      worker.on('completed', job => jobContainer.onComplete(job, this))
    }

    // An onFailed handler must always be defined
    worker.on('failed', jobContainer.onFailed)

    // Register all the details in the map
    this._queues.set(jobContainer.jobName, {
      jobContainer,
      worker
    })
  }

  async stop () {
    for (const [jobName, { worker }] of this._queues) {
      await closeWorker(jobName, worker)
    }
  }
}

module.exports = WorkerManager
