const batchService = require('../../services/batch-service');
const logger = require('./logger');

const createJobId = (jobName, batch, id) => {
  const baseName = jobName.replace('*', batch.id);
  return id ? `${baseName}.${id}` : baseName;
};

const createFailedHandler = errorCode => async (job, err) => {
  logger.logFailed(job, err);
  batchService.setErrorStatus(job.data.batch.id, errorCode);
};

exports.createJobId = createJobId;
exports.createFailedHandler = createFailedHandler;
