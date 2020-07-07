'use strict';

const helpers = require('./helpers');

/**
 * Creates and configures a Bull Redis-backed message queue
 * @param {Object} jobConfig
 */
const createQueue = jobConfig => {
  const queue = helpers.createQueue(jobConfig.jobName);

  const publish = (...args) => {
    const { data, options = {} } = jobConfig.createMessage(...args);
    return queue.add(data, options);
  };

  queue.process(jobConfig.processor);

  if (jobConfig.onComplete) {
    queue.on('completed', jobConfig.onComplete);
  }
  if (jobConfig.onFailed) {
    queue.on('failed', (job, err) => jobConfig.onFailed(queue, job, err));
  }

  return {
    queue,
    publish
  };
};

exports.createQueue = createQueue;
