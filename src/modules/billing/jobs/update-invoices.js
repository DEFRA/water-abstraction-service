const uuid = require('uuid/v4');

// Models
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');

// Utils
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');
const { jobNames } = require('../../../lib/constants');

const JOB_NAME = jobNames.updateInvoices;

const { logger } = require('../../../logger');

const createMessage = data => ([
  JOB_NAME,
  data,
  {
    jobId: `${JOB_NAME}.${data.batch.id}.${uuid()}`,
    attempts: 10,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
]);

const handler = async job => {
  try {
    // Create the worker.
    const fork = require('child_process').fork;
    const child = fork('./src/modules/billing/jobs/lib/update-invoices-worker.js');
    child.on('message', msg => {
      if (msg.error) {
        logger.error(msg.error);
      } else {
        logger.info('Message from child: ', msg);
      }
    });
    return child.send(job.data);
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
