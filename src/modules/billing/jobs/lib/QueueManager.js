'use strict';

const bull = require('bullmq');
const ioRedis = require('../../../../lib/connectors/io-redis');

const STATUS_COMPLETED = 'completed';
const STATUS_FAILED = 'failed';

/**
 * @class provides a container for the Bull MQ job queues
 */
class QueueManager {
  constructor () {
    this._queues = {};
  }

  /**
   * Adds a job to the queue with the requested name
   * @param {String} jobName
   * @param  {...any} args
   */
  add (jobName, ...args) {
    const { createMessage } = this._queues[jobName].jobContainer;
    return this._queues[jobName].queue.add(
      ...createMessage(...args)
    );
  }

  /**
   * Registers a job container
   * @param {Object} jobContainer
   * @param {String} jobContainer.jobName - the job/queue name
   * @param {Function} jobContainer.handler - the handler for the job
   * @param {Boolean} jobContainer.hasScheduler - whether a scheduler is needed - for jobs with retry etc
   * @param {Function} jobContainer.onComplete - on complete handler, called with (job, queueManager)
   * @param {Function} jobContainer.onFailed - on failed handler
   */
  register (jobContainer) {
    // Create connection for queue
    const connection = ioRedis.createConnection();

    // Create queue
    const queue = new bull.Queue(jobContainer.jobName, { connection });

    // Register worker
    const worker = new bull.Worker(jobContainer.jobName, jobContainer.handler, { connection });

    // Create scheduler
    const scheduler = jobContainer.hasScheduler
      ? new bull.QueueScheduler(jobContainer.jobName, { connection: ioRedis.createConnection() })
      : null;

    // Register handlers
    if (jobContainer.onComplete) {
      worker.on(STATUS_COMPLETED, job => jobContainer.onComplete(job, this));
    }
    worker.on(STATUS_FAILED, jobContainer.onFailed);

    this._queues[jobContainer.jobName] = {
      jobContainer,
      queue,
      worker,
      scheduler
    };

    return this;
  }
}

module.exports = QueueManager;
