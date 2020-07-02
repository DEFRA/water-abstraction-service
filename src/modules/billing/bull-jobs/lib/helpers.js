const batchService = require('../../services/batch-service');
const logger = require('./logger');

const createJobId = (jobName, batch, id) => {
  const baseName = jobName.replace('*', batch.id);
  return id ? `${baseName}.${id}` : baseName;
};

const deleteJobs = async (queue, jobName, job) => {
  const queueName = jobName.replace('*', job.batch.id);
  logger.logInfo(job, `Deleting queue ${queueName}`);
  return Promise.all([
    queue.removeJobs(queueName),
    queue.removeJobs(`${queueName}.*`)
  ]);
};

const createFailedHandler = (errorCode, queue, jobName) => async (job, err) => {
  logger.logFailed(job, err);
  batchService.setErrorStatus(job.data.batch.id, errorCode);

  // Delete remaining jobs in queue
  if (jobName) {
    return deleteJobs(queue, jobName, job);
  }
};

exports.createJobId = createJobId;
exports.createFailedHandler = createFailedHandler;
