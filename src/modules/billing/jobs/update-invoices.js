const { isNull } = require('lodash');

const { jobNames } = require('../../../lib/constants');
const JOB_NAME = jobNames.updateInvoices;
const Bluebird = require('bluebird');

const Transaction = require('../../../lib/models/transaction');

const invoiceService = require('../../../lib/services/invoice-service');
const transactionService = require('../services/transactions-service');

const batchJob = require('./lib/batch-job');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const helpers = require('./lib/helpers');
const updateInvoiceJob = require('./update-invoice');
const transactionMapper = require('../mappers/transaction');
const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs');

const getCustomerFinancialYearKey = (invoiceAccountNumber, financialYearEnding) =>
  `${invoiceAccountNumber}_${financialYearEnding}`;

const getWRLSInvoiceKey = invoice => isNull(invoice.rebillingState)
  ? getCustomerFinancialYearKey(invoice.invoiceAccount.accountNumber, invoice.financialYear.endYear)
  : invoice.externalId;

const getCMInvoiceKey = cmInvoice => cmInvoice.rebilledType === 'O'
  ? getCustomerFinancialYearKey(cmInvoice.customerReference, cmInvoice.financialYear + 1)
  : cmInvoice.id;

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

const updateInvoices = updateInvoiceJob.createMessage;

const createMap = (items, keyMapper) => items.reduce(
  (map, item) => map.set(keyMapper(item), item),
  new Map()
);

const handler = async job => {
  try {
    const { batch, cmResponse } = job.data;

    const invoices = await invoiceService.getInvoicesForBatch(batch, { includeTransactions: true });

    // Map WRLS invoices and CM invoices by the same keys
    const invoiceMaps = {
      wrls: createMap(invoices, getWRLSInvoiceKey),
      cm: createMap(cmResponse.billRun.invoices, getCMInvoiceKey)
    };

    // Iterate through invoices in series, to avoid overwhelming CM with too many simultaneous requests
    return Bluebird.mapSeries(invoiceMaps.cm, async ([key, cmInvoice]) => {
        const inv = invoiceMaps.wrls.get(key);
        inv && updateInvoices(batch, inv, cmInvoice);
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
exports.onComplete = onComplete;
exports.onFailed = helpers.onFailedHandler;
