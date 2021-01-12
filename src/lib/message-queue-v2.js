'use strict';

/**
 * Create message queue powered by BullMQ
 * @see {@link https://docs.bullmq.io/guide/introduction}
 */
const bull = require('bullmq');
const ioRedis = require('../lib/connectors/io-redis');

const STATUS_COMPLETED = 'completed';
const STATUS_FAILED = 'failed';

/**
 * @class provides a container for the Bull MQ job queues
 * This is to extract the dependency on Bull out of the job code to make them
 * more testable.
 * This class contains a map of queues, where the keys are the job names.
 * Each item contains a Bull Queue instance and necessary workers.
 * The onComplete handlers are wrapped so that the QueueManager instance
 * can pass itself as an argument - this allows the onComplete handlers
 * to add jobs on another queue
 */
class QueueManager {
  constructor () {
    this._queues = new Map();
  }

  /**
   * Adds a job to the queue with the requested name
   * @param {String} jobName
   * @param  {...any} args
   */
  add (jobName, ...args) {
    const queueContainer = this._queues.get(jobName);
    const { createMessage } = queueContainer.jobContainer;

    return queueContainer.queue.add(
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
   * @param {Object} [jobContainer.workerOptions] - options to pass to the worker constructor
   */
  register (jobContainer) {
    // Create connection for queue
    const connection = ioRedis.createConnection();

    // Create queue
    const queue = new bull.Queue(jobContainer.jobName, { connection });

    // Create worker with handler
    const workerOpts = {
      ...(jobContainer.workerOptions || {}),
      connection
    };
    const worker = new bull.Worker(jobContainer.jobName, jobContainer.handler, workerOpts);

    // Create scheduler - this is only set up if the hasScheduler flag is set.
    // This is needed if the job makes use of Bull features such as retry/cron
    const scheduler = jobContainer.hasScheduler
      ? new bull.QueueScheduler(jobContainer.jobName, { connection: ioRedis.createConnection() })
      : null;

    // Register onComplete handler if defined
    if (jobContainer.onComplete) {
      worker.on(STATUS_COMPLETED, job => jobContainer.onComplete(job, this));
    }
    // An onFailed handler must always be defined
    worker.on(STATUS_FAILED, jobContainer.onFailed);

    // Register all the details in the map
    this._queues.set(jobContainer.jobName, {
      jobContainer,
      queue,
      worker,
      scheduler
    });

    return this;
  }
}

const queueManager = new QueueManager();

module.exports.queueManager = queueManager;

module.exports.plugin = {
  name: 'hapiBull',
  register: async server => {
    server.decorate('server', 'queueManager', queueManager);
    server.decorate('request', 'queueManager', queueManager);
  }
};
