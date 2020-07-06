'use strict';

const Bull = require('bull');
const config = require('../../../../../config');

/**
 * Creates and configures a Bull Redis-backed message queue
 * @param {Object} jobConfig
 */
const createQueue = jobConfig => {
  const queue = new Bull(jobConfig.jobName, { redis: config.redis });

  const publish = (...args) => {
    const { data, options = {} } = jobConfig.createMessage(...args);
    console.log('publish', { data, options });
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
