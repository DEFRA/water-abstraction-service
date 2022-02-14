const uuid = require('uuid/v4');

// Models
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');

// Utils
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');
const { jobNames } = require('../../../lib/constants');

const JOB_NAME = jobNames.updateInvoices;

const createMessage = (batch, cmResponse) => ([
  JOB_NAME,
  {
    batch,
    cmResponse
  },
  {
    jobId: `${JOB_NAME}.${batch.id}.${uuid()}`,
    attempts: 10,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
]);

const handler = async job => {
  try {
    const { batch, cmResponse } = job.data;
    // Create the worker.
    const fork = require('child_process').fork
    const child = fork('./src/modules/billing/jobs/lib/update-invoices-worker.js');
    return child.send({ cmResponse, batch });
  } catch (err) {
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToGetChargeModuleBillRunSummary);
    throw err;
  }
};

const onComplete = async job => batchJob.logOnComplete(job);

exports.jobName = JOB_NAME;
exports.handler = handler;
exports.createMessage = createMessage;
exports.onComplete = onComplete;
exports.onFailed = helpers.onFailedHandler;
exports.workerOptions = {
  maxStalledCount: 3,
  stalledInterval: 120000,
  lockDuration: 120000,
  lockRenewTime: 120000 / 2
};
