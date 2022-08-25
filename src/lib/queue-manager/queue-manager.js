'use strict'

const BullMQ = require('bullmq')
const config = require('../../../config')
const { logger } = require('../../logger')

/**
 * Stores and manages everything to do with BullMQ queues
 *
 * A service class that is decorated as a singleton instance on the Hapi server and request objects. At start up various
 * modules 'register as subscribers' by passing through 'jobs' to the `register()` function. Using the information in
 * those jobs this class instantiates corresponding BullMQ {@link https://docs.bullmq.io/guide/queues|Queue},
 * {@link https://docs.bullmq.io/guide/workers|Worker}, and in some cases,
 * {@link https://docs.bullmq.io/guide/queuescheduler|QueueScheduler} instances.
 *
 * Modules can then use the `QueueManager` to add new jobs or delete queues. During shutdown it is used to tell all
 * workers to close in an effort to exit gracefully.
 */
class QueueManager {
  constructor (connection) {
    this._connection = connection
    this._queues = new Map()
  }

  /**
   * Adds a BullMQ job to the matching queue
   *
   * @param {string} jobName The WRLS job name. This will have been used as the name for the queue
   * @param {...*} args Any additional arguments to pass through to the WRLS job's `createMessage()` method. These will
   * be used to generate the arguments for BullMQ's `Queue.add()` methodwhich adds a job to a queue
   *
   * @returns {Promise} With a Promise being returns those that call `add()` can choose whether to `await` the call or
   * continue
   */
  add (jobName, ...args) {
    logger.info(`Attempting to queue a BullMQ job: ${jobName}`)
    const jobContainer = this._queues.get(jobName)
    const { createMessage } = jobContainer.job
    const [name, data, options] = createMessage(...args)

    return jobContainer.queue.add(name, data, {
      removeOnComplete: true,
      removeOnFail: 500,
      ...options
    })
  }

  /**
   * Registers a job
   *
   * This involves instantiating a BullMQ {@link https://docs.bullmq.io/guide/queues|Queue},
   * {@link https://docs.bullmq.io/guide/workers|Worker}, and where requested, a
   * {@link https://docs.bullmq.io/guide/queuescheduler|QueueScheduler} for each 'job' passed in.
   *
   * A job in BullMQ is simply JSON object added to a queue. The worker for that queue will see the job, grab the data
   * and then call a 'handler' (a function you've provided) to do something with it.
   *
   * A job in WRLS terms is everything related to this. So, the job name, the handler, whether a queue scheduler is
   * needed, any options to pass to the worker, and the handlers to call when the worker fires its `onComplete()` and
   * `onFailed()` {@link https://docs.bullmq.io/guide/events|events}.
   *
   * All jobs are expected to have the following properties
   *
   * - `jobName` the name to use when referencing this job. Will be used to name the Queue
   * - `handler` the function the worker will call when it takes a 'job' off the queue
   * - `hasScheduler` whether the job needs a `QueueScheduler`. These are needed where a job is repeatable, scheduled
   *    with cron, or can be retried
   * - `onFailed` the function to call when the worker fires this event
   *
   * They may also have these optional properties
   *
   * - `startClean` when set to `true` we tell Redis to remove the existing queue before registering the new one
   * - `onComplete` the function to call when the worker fires this event
   * - `workerOptions` any additional options to pass to the worker when instantiated. Often these will be extensions
   *    to the lock timings i.e. how long a worker has to complete a job.
   *
   * They must also have a `createMessage()` method which is used when adding BullMQ jobs to a queue.
   *
   * @param {Object} wrlsJob A WRLS job as defined in our modules that has the properties required for QueueManager to
   * set up the appropriate queue and worker
   *
   * @returns {Object} `this` instance of QueueManager. It enables chaining calls to `register()`
   */
  register (wrlsJob) {
    const { _connection: connection } = this

    logger.info(`Registering job: ${wrlsJob.jobName}`)

    if (wrlsJob.startClean) {
      this._cleanQueue(wrlsJob.jobName)
    }

    const queue = new BullMQ.Queue(wrlsJob.jobName, { connection })

    const workerAndQueueScheduler = this._createWorkerAndQueueScheduler(wrlsJob, connection)

    // Register all the details in the map
    this._queues.set(wrlsJob.jobName, {
      job: wrlsJob,
      queue,
      ...workerAndQueueScheduler
    })

    return this
  }

  async _cleanQueue (name) {
    try {
      logger.info(`Cleaning queue ${name}`)
      await this.deleteKeysByPattern(`*${name}*`)
    } catch (err) {

    }
  }

  /**
   * Delete keys in Redis
   *
   * Each queue is a {@link https://redis.io/docs/data-types/hashes/|redis collection of hashes}. Back when this was
   * implemented there was no feature in BullMQ for clearing a queue. You had to resort to ioredis to do it.
   *
   * Now BullMQ has various features such as
   *
   * - {@link https://api.docs.bullmq.io/classes/Queue.html#clean|clean()}
   * - {@link https://api.docs.bullmq.io/classes/Queue.html#drain|drain()}
   * - {@link https://api.docs.bullmq.io/classes/Queue.html#obliterate|obliterate}
   *
   * The last of these replicates how the service uses `deleteKeysByPattern()` based on the uses we can find. Some jobs
   * prior to registering themselves with `QueueManager` call `deleteKeysByPattern()` to remove the existing queue and
   * start afresh.
   *
   * @param {String} pattern A {@link https://redis.io/commands/keys/|redis compatible glob pattern} to match keys to
   * be deleted
   */
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
   * Close all BullMQ queuse and workers
   *
   * Called during the shutdown process for the app, when `SIGINT` is triggered or an untrapped error manages to bubble
   * to the surface.
   *
   * The BullMQ docs highlight using calling `worker.close() for a
   * {@link https://docs.bullmq.io/guide/workers/graceful-shutdown|graceful shutdown}. But we also found
   * {@link https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#queueclose|Queue.close()} in their reference
   * with the comment
   *
   * > Closes the underlying Redis client. Use this to perform a graceful shutdown.
   *
   * So, we do both! Also note, if closing the queue fails we still attempt to close the worker. We're concious that in
   * production environments running under pm2 if the app fails it will automatically be restarted. By closing what we
   * can gracefully we give the restart a better chance of succeeding.
   */
  async closeAll () {
    for (const [jobName, { worker, queue }] of this._queues) {
      logger.info(`Closing queue and worker ${jobName}`)
      await this._closeQueue(jobName, queue)

      if (worker) {
        await this._closeWorker(jobName, worker)
      }
    }
  }

  async _closeQueue (name, queue) {
    try {
      await queue.close()
    } catch (err) {
      logger.error(`Error closing queue ${name}`, err)
    }
  }

  async _closeWorker (name, worker) {
    try {
      await worker.close()
    } catch (err) {
      logger.error(`Error closing worker ${name}`, err)
    }
  }

  _createWorkerAndQueueScheduler (wrlsJob, connection) {
    const result = {}

    if (!config.isBackground) {
      return result
    }

    // TODO: Implement metrics so we can see how workers are doing. Add the following line to workerOpts and require
    // `MetricsTime` from bullmq https://docs.bullmq.io/guide/metrics
    // metrics: { maxDataPoints: MetricsTime.ONE_WEEK * 2 },
    const workerOptions = {
      ...(wrlsJob.workerOptions || {}),
      connection
    }

    result.worker = new BullMQ.Worker(wrlsJob.jobName, wrlsJob.handler, workerOptions)

    if (wrlsJob.onComplete) {
      result.worker.on('completed', job => wrlsJob.onComplete(job, this))
    }

    result.worker.on('failed', wrlsJob.onFailed)

    // This is needed if the job makes use of Bull features such as retry/repeat/cron
    result.scheduler = wrlsJob.hasScheduler
      ? new BullMQ.QueueScheduler(wrlsJob.jobName, { connection })
      : null

    return result
  }
}

module.exports = { QueueManager }
