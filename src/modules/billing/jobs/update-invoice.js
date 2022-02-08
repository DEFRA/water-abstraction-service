const { jobNames } = require('../../../lib/constants');
const JOB_NAME = jobNames.updateInvoice;
const { partial } = require('lodash');
const invoiceService = require('../../../lib/services/invoice-service');

const batchJob = require('./lib/batch-job');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const helpers = require('./lib/helpers');
const invoiceMapper = require('../../../lib/mappers/invoice');

const messageInitialiser = (batch, invoice, cmInvoiceSummary) => ([
  JOB_NAME,
  {
    batch, invoice, cmInvoiceSummary
  },
  {
    jobId: `${JOB_NAME}.${batch}.${invoice}}`,
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true
  }
]);

const createMessage = partial(messageInitialiser);

const handler = async job => {
  try {
    const {batch, invoice, cmInvoiceSummary} = job.data;

    const cmTransactions = await getAllCmTransactionsForInvoice(
      batch.externalId,
      cmInvoiceSummary.id
    );

    // Populate invoice model with updated CM data
    invoice.fromHash(
      invoiceMapper.cmToPojo(cmInvoiceSummary, cmTransactions)
    );

    // Persist invoice and transactions to DB
    await invoiceService.updateInvoiceModel(invoice);
    return  updateTransactions(invoice, cmTransactions);
  } catch (err) {
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToGetChargeModuleBillRunSummary);
    throw err;
  }
};

const onComplete = async (job, queueManager) => batchJob.logOnComplete(job);

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handler;
exports.onComplete = onComplete;
exports.onFailed = helpers.onFailedHandler;
