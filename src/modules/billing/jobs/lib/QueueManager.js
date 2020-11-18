'use strict';

// Bull queue setup
const { Queue, Worker, QueueScheduler } = require('bullmq');
const ioRedis = require('../../../../lib/connectors/io-redis');

const STATUS_COMPLETED = 'completed';
const STATUS_FAILED = 'failed';

class QueueManager {
  constructor () {
    this._queues = {};
  }

  add (jobName, ...args) {
    console.log({
      jobName,
      args
    });
    const { createMessage } = this._queues[jobName].jobContainer;
    return this._queues[jobName].queue.add(
      ...createMessage(...args)
    );
  }

  register (jobContainer) {
    // Create connection for queue
    const connection = ioRedis.createConnection();

    // Create queue
    const queue = new Queue(jobContainer.jobName, { connection });

    // Register worker
    const worker = new Worker(jobContainer.jobName, jobContainer.handler, { connection });

    // Create scheduler
    const scheduler = jobContainer.hasScheduler
      ? new QueueScheduler(jobContainer.jobName, { connection: ioRedis.createConnection() })
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
