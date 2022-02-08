const { isNull } = require('lodash');

const { jobNames } = require('../../../lib/constants');
const JOB_NAME = jobNames.updateInvoices;
const Bluebird = require('bluebird');

const invoiceService = require('../../../lib/services/invoice-service');

const batchJob = require('./lib/batch-job');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const helpers = require('./lib/helpers');
const updateInvoiceJob = require('./update-invoice');

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

const getCustomerFinancialYearKey = (invoiceAccountNumber, financialYearEnding) =>
  `${invoiceAccountNumber}_${financialYearEnding}`;

const getWRLSInvoiceKey = invoice => isNull(invoice.rebillingState)
  ? getCustomerFinancialYearKey(invoice.invoiceAccount.accountNumber, invoice.financialYear.endYear)
  : invoice.externalId;

const getCMInvoiceKey = cmInvoice => cmInvoice.rebilledType === 'O'
  ? getCustomerFinancialYearKey(cmInvoice.customerReference, cmInvoice.financialYear + 1)
  : cmInvoice.id;

const createMap = (items, keyMapper) => items.reduce(
  (map, item) => map.set(keyMapper(item), item),
  new Map()
);

const handler = async job => {
  try {
    const { batch, cmResponse } = job.data;

    const invoices = await invoiceService.getInvoicesForBatch(batch, { includeTransactions: true });

    // Map WRLS invoices and CM invoices by the same keys
    // TODO fix this mapper. It's awful.
    console.log('The problem is here vvvvvvvvvvv')
    const invoiceMaps = {
      wrls: createMap(invoices, getWRLSInvoiceKey),
      cm: createMap(cmResponse.billRun.invoices, getCMInvoiceKey)
    };
    // Iterate through invoices in series, to avoid overwhelming CM with too many simultaneous requests

    return Bluebird.each(invoiceMaps.cm, async ([key, cmInvoice]) => {
        const inv = invoiceMaps.wrls.get(key);
        inv && updateInvoiceJob.createMessage(batch, inv, cmInvoice)
      }
    );
  } catch (err) {
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToGetChargeModuleBillRunSummary);
    throw err;
  }
};

const onComplete = async (job, queueManager) => batchJob.logOnComplete(job);

exports.jobName = JOB_NAME;
exports.handler = handler;
exports.createMessage = createMessage;
exports.onComplete = onComplete;
exports.onFailed = helpers.onFailedHandler;
exports.workerOptions = {
  maxStalledCount: 3,
  stalledInterval: 120000,
  lockDuration: 3600000,
  lockRenewTime: 3600000 / 2
};
