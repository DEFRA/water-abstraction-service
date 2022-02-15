const Bluebird = require('bluebird');
const { isNull, difference } = require('lodash');

// Models
const Transaction = require('../../../../lib/models/transaction');

// Services
const invoiceService = require('../../../../lib/services/invoice-service');
const transactionService = require('../../services/transactions-service');

// Mappers
const invoiceMapper = require('../../../../lib/mappers/invoice');
const transactionMapper = require('../../mappers/transaction');

// Connectors
const chargeModuleBillRunConnector = require('../../../../lib/connectors/charge-module/bill-runs');

const { logger } = require('../../../../logger');

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

const invoiceMaps = (invoices, cmResponse) => ({
  wrls: createMap(invoices, getWRLSInvoiceKey),
  cm: createMap(cmResponse.billRun.invoices, getCMInvoiceKey)
});

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

process.on('message', async data => {
  try {
    const invoices = await invoiceService.getInvoicesForBatch(data.batch, { includeTransactions: true });
    const returnableMaps = invoiceMaps(invoices, data.cmResponse);

    Bluebird.each(returnableMaps.cm, async ([key, cmInvoice]) => {
      const invoice = returnableMaps.wrls.get(key);
      if (invoice) {
        const cmTransactions = await getAllCmTransactionsForInvoice(
          data.batch.externalId,
          cmInvoice.id
        );

        process.send(`Found ${cmTransactions.length} transactions to process from the CM for invoice ${invoice.id}`);
        // Populate invoice model with updated CM data
        invoice.fromHash(
          invoiceMapper.cmToPojo(cmInvoice, cmTransactions)
        );

        // Persist invoice and transactions to DB
        await invoiceService.updateInvoiceModel(invoice);
        await updateTransactions(invoice, cmTransactions);
      }
    });

    return process.send(`Updating invoices complete for ${data.batch.id}`);
  } catch (e) {
    console.log(e)
    process.send({ error: e });
  }
});
