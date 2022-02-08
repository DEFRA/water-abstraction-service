const { partial, difference } = require('lodash');
const { logger } = require('../../../logger');

// Services
const invoiceService = require('../../../lib/services/invoice-service');
const transactionService = require('../services/transactions-service');

// Mappers
const invoiceMapper = require('../../../lib/mappers/invoice');
const transactionMapper = require('../mappers/transaction');

// Models
const Transaction = require('../../../lib/models/transaction');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');

// Utils
const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs');
const { jobNames } = require('../../../lib/constants');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');


const JOB_NAME = jobNames.updateInvoice;

const mapTransaction = (transactionMap, cmTransaction) => {
  const transaction = transactionMap.has(cmTransaction.id)
    ? transactionMap.get(cmTransaction.id)
    : new Transaction();

  return transaction.fromHash(transactionMapper.cmToPojo(cmTransaction));
};

const getTransactionMap = invoice => {
  return invoice.invoiceLicences.reduce((map, invoiceLicence) => {
    invoiceLicence.transactions.forEach(transaction => {
      map.set(transaction.externalId, transaction);
    });
    return map;
  }, new Map());
};

const getCMTransactionId = cmTransaction => cmTransaction.id;

const deleteTransactions = (cmTransactions, transactionMap) => {
  const validIds = cmTransactions.map(getCMTransactionId);
  const deleteExternalIds = difference(Array.from(transactionMap.keys()), validIds);
  const deleteIds = deleteExternalIds.map(
    externalId => transactionMap.get(externalId).id
  );
  return transactionService.deleteById(deleteIds);
};

const updateTransactions = async (invoice, cmTransactions) => {
  // Index WRLS transactions by external ID
  const transactionMap = getTransactionMap(invoice);

  // Create/update transactions
  for (const cmTransaction of cmTransactions) {
    const invoiceLicence = invoice.getInvoiceLicenceByLicenceNumber(cmTransaction.licenceNumber);
    const transaction = mapTransaction(transactionMap, cmTransaction);

    await transactionService.saveTransactionToDB(invoiceLicence, transaction);
  }

  // Delete transactions no longer on the CM side
  return deleteTransactions(cmTransactions, transactionMap);
};

const getAllCmTransactionsForInvoice = async (cmBillRunId, invoiceId) => {
  try {
    const { invoice } = await chargeModuleBillRunConnector.getInvoiceTransactions(cmBillRunId, invoiceId);
    return invoice.licences.map(lic => lic.transactions.map(transaction => {
      return {
        ...transactionMapper.inverseCreditNoteSign(transaction),
        transactionReference: invoice.transactionReference,
        isDeminimis: invoice.deminimisInvoice,
        licenceNumber: lic.licenceNumber
      };
    })).flat();
  } catch (error) {
    logger.error(`Unable to retrieve transactions for CM invoice. Bill run ID ${cmBillRunId} and invoice ID ${invoiceId}`);
    throw error;
  }
};

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
    const { batch, invoice, cmInvoiceSummary } = job.data;

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
    return updateTransactions(invoice, cmTransactions);
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
