'use strict';

const { logger } = require('../../../logger');

// Models
const Transaction = require('../../../lib/models/transaction');

// Services
const chargeModuleBillRunApi = require('../../../lib/connectors/charge-module/bill-runs');
const invoiceService = require('../../../lib/services/invoice-service');
const invoiceLicenceService = require('./invoice-licences-service');
const transactionService = require('./transactions-service');

// Mappers
const invoiceMapper = require('../../../lib/mappers/invoice');
const transactionMapper = require('../mappers/transaction');

const rebillInvoice = async (batch, sourceInvoiceId) => {
  const sourceInvoice = await invoiceService.getInvoiceById(sourceInvoiceId);

  try {
    const { invoices: cmInvoices } = await chargeModuleBillRunApi.rebillInvoice(batch.externalId, sourceInvoice.externalId);
    for (const cmInvoice of cmInvoices) {
      await createInvoice(batch, sourceInvoice, cmInvoice.id);
    }
  } catch (err) {
    logger.error(`Failed to mark invoice ${sourceInvoice.id} for rebilling in charge module`);
    throw err;
  }
};

const createInvoice = async (batch, sourceInvoice, cmInvoiceId) => {
  const { invoice: cmInvoice } = await chargeModuleBillRunApi.getInvoiceTransactions(batch.externalId, cmInvoiceId);

  // Additional properties which should be set on the invoice model
  // to reflect the CM re-billing state
  const invoiceProperties = {
    ...invoiceMapper.cmToPojo(cmInvoice),
    originalInvoiceId: sourceInvoice.id
  };

  const rebillInvoice = await invoiceService.getOrCreateInvoice(
    batch.id,
    sourceInvoice.invoiceAccount.id,
    sourceInvoice.financialYear.yearEnding,
    invoiceProperties
  );

  return createInvoiceLicences(sourceInvoice, rebillInvoice, cmInvoice);
};

const createInvoiceLicences = async (sourceInvoice, rebillInvoice, cmInvoice) => {
  for (const sourceInvoiceLicence of sourceInvoice.invoiceLicences) {
    const cmLicence = getCMLicenceByLicenceNumber(cmInvoice, sourceInvoiceLicence.licence.licenceNumber);
    await createInvoiceLicence(rebillInvoice, sourceInvoiceLicence, cmLicence);
  }
};

const getCMLicenceByLicenceNumber = (cmInvoice, licenceNumber) => cmInvoice.licences.find(
  row => row.licenceNumber === licenceNumber
);

const createInvoiceLicence = async (rebillInvoice, sourceInvoiceLicence, cmLicence) => {
  const rebillInvoiceLicence = await invoiceLicenceService.saveInvoiceLicenceToDB(rebillInvoice, sourceInvoiceLicence);
  return createTransactions(rebillInvoiceLicence, sourceInvoiceLicence, cmLicence);
};

const createTransactions = async (rebillInvoiceLicence, sourceInvoiceLicence, cmLicence) => {
  for (const sourceTransaction of sourceInvoiceLicence.transactions) {
    // Find CM transaction
    const cmTransaction = getCMTransactionByRebilledTransactionId(cmLicence, sourceTransaction.externalId);

    // Create rebill transaction service model
    const rebillTransaction = new Transaction()
      .fromHash(sourceTransaction)
      .fromHash(transactionMapper.cmToPojo(cmTransaction));

    // Persist
    await transactionService.saveTransactionToDB(rebillInvoiceLicence, rebillTransaction);
  }
};

const getCMTransactionByRebilledTransactionId = (cmLicence, id) => cmLicence.transactions.find(
  row => row.rebilledTransactionId === id
);

exports.rebillInvoice = rebillInvoice;
