'use strict';

const { first, find } = require('lodash');

const repos = require('../../../lib/connectors/repository');
const newRepos = require('../../../lib/connectors/repos');

const mappers = require('../mappers');

// Connectors
const chargeModuleBatchConnector = require('../../../lib/connectors/charge-module/batches');

// Services
const transactionsService = require('./transactions-service');
const invoiceAccountsService = require('./invoice-accounts-service');

// Models
const Invoice = require('../../../lib/models/invoice');
const InvoiceAccount = require('../../../lib/models/invoice-account');
const InvoiceLicence = require('../../../lib/models/invoice-licence');
const Licence = require('../../../lib/models/licence');
const Address = require('../../../lib/models/address');
const Company = require('../../../lib/models/company');
const Contact = require('../../../lib/models/contact-v2');
const Transaction = require('../../../lib/models/transaction');

const mapRowToModels = row => {
  const invoice = new Invoice(row['billing_invoices.billing_invoice_id']);
  invoice.dateCreated = row['billing_invoices.date_created'];
  invoice.invoiceAccount = new InvoiceAccount();
  invoice.invoiceAccount.id = row['billing_invoices.invoice_account_id'];
  invoice.invoiceAccount.accountNumber = row['billing_invoices.invoice_account_number'];

  const invoiceLicence = new InvoiceLicence();
  invoiceLicence.id = row['billing_invoice_licences.billing_invoice_licence_id'];
  invoiceLicence.address = new Address(row['billing_invoice_licences.address_id']);
  invoiceLicence.company = new Company(row['billing_invoice_licences.company_id']);
  invoiceLicence.contact = new Contact(row['billing_invoice_licences.contact_id']);
  invoiceLicence.licence = new Licence();
  invoiceLicence.licence.id = row['billing_invoice_licences.licence_id'];
  invoiceLicence.licence.licenceNumber = row['billing_invoice_licences.licence_ref'];

  return { invoice, invoiceLicence };
};

/**
 * Applies any matching transactions to the invoices
 *
 * @param {Array<Invoice>} invoices THe invoices that are to have any mathcing transactions applied
 * @param {Array<ChargeModuleTransaction>} chargeModuleTransactions The transactions from the charge module api
 */
const decorateInvoicesWithTransactions = (invoices, chargeModuleTransactions) => {
  return invoices.map(invoice => {
    invoice.invoiceLicences = invoice.invoiceLicences.map(invoiceLicence => {
      const chargeModuleTransaction = chargeModuleTransactions.find(tx => {
        return tx.licenceNumber === invoiceLicence.licence.licenceNumber &&
        tx.accountNumber === invoice.invoiceAccount.accountNumber;
      });

      if (chargeModuleTransaction) {
        const transaction = Transaction.fromChargeModuleTransaction(chargeModuleTransaction);
        invoiceLicence.transactions = [...invoiceLicence.transactions, transaction];
      }
      return invoiceLicence;
    });
    return invoice;
  });
};

/**
 * Adds the Company object to the InvoiceAccount objects in the Invoice.
 *
 * @param {Array<Invoice>} invoices The invoices to add invoice account companies to
 */
const decorateInvoicesWithCompanies = async invoices => {
  const invoiceAccountIds = invoices.map(invoice => invoice.invoiceAccount.id);
  const invoiceAccounts = await invoiceAccountsService.getByInvoiceAccountIds(invoiceAccountIds);

  return invoices.map(invoice => {
    const invoiceAccount = invoiceAccounts.find(ia => ia.id === invoice.invoiceAccount.id);

    if (invoiceAccount && invoiceAccount.company) {
      invoice.invoiceAccount.company = invoiceAccount.company;
    }
    return invoice;
  });
};

/**
 *  Adds contacts and transactions to the Invoice objects
 *
 * @param {Array<Invoice>} invoices A list of invoices that are to be decorated
 * @param {Array<Transaction>} transactions A list of transactions to apply to the invoices
 */
const decorateInvoices = async (invoices, transactions) => {
  return decorateInvoicesWithTransactions(
    await decorateInvoicesWithCompanies(invoices),
    transactions
  );
};

const createInvoiceModelsFromBatchInvoiceRows = batchInvoiceRows => {
  const invoicesHash = batchInvoiceRows.reduce((acc, row) => {
    const invoiceId = row['billing_invoices.billing_invoice_id'];
    const rowModels = mapRowToModels(row);

    if (!acc[invoiceId]) {
      acc[invoiceId] = rowModels.invoice;
    }

    const invoice = acc[invoiceId];
    const { invoiceLicence } = rowModels;
    invoice.invoiceLicences = [...invoice.invoiceLicences, invoiceLicence];

    return acc;
  }, {});

  return Object.values(invoicesHash);
};

/**
 * Finds an invoice and its licences for the given batch, then
 * overlays the transactions found from the charge-module, and the
 * contacts from the CRM
 *
 * @param {String} batchId UUID of the batch to find invoices for
 * @param {String} invoiceId UUID of the invoice
 */
const getInvoiceForBatch = async (batchId, invoiceId) => {
  const batchInvoiceRows = await repos.billingInvoices.findByBatchId(batchId);
  const invoiceRows = batchInvoiceRows.filter(invoice => invoice['billing_invoices.billing_invoice_id'] === invoiceId);

  if (invoiceRows.length > 0) {
    const [invoice] = createInvoiceModelsFromBatchInvoiceRows(invoiceRows);
    const chargeModuleTransactions = await transactionsService.getTransactionsForBatchInvoice(batchId, invoice.invoiceAccount.accountNumber);
    return first(await decorateInvoices([invoice], chargeModuleTransactions));
  }
};

/**
 * Saves an Invoice model to water.billing_invoices
 * @param {Batch} batch
 * @param {Invoice} invoice
 * @return {Promise<Object>} row data inserted (camel case)
 */
const saveInvoiceToDB = async (batch, invoice) => {
  const data = mappers.invoice.modelToDb(batch, invoice);
  return newRepos.billingInvoices.upsert(data);
};

/**
 * Given an Invoice model and the data from a charge module bill run call,
 * decorates the invoice model with a ChargeModuleSummary model
 * @param {Invoice} invoice
 * @param {Object} chargeModuleBillRun
 * @return {Invoice} - the decorated invoice
 */
const decorateInvoiceWithTotals = (invoice, chargeModuleBillRun) => {
  const { accountNumber } = invoice.invoiceAccount;
  const cmInvoice = find(chargeModuleBillRun.customers, row => row.customerReference === accountNumber);
  if (!cmInvoice) {
    throw new Error('Customer not found in charge module draft batch', { accountNumber });
  }
  invoice.totals = mappers.totals.chargeModuleSummaryByFinancialYearToModel(cmInvoice.summaryByFinancialYear);
  return invoice;
};

/**
 * Converts a row of invoice row data from water.billing_invoices to Invoice models
 * And decorates with charge module summaries and company data from CRM
 * @param {Array} rows - array of invoice data loaded from water.billing_invoices
 * @param {Object} chargeModuleSummary - response from charge module bill run API call
 * @return {Promise<Array>} array of Invoice instances
 */
const getInvoicesForBatch = async batchId => {
  // Load Batch instance from repo with invoices
  const data = await newRepos.billingBatches.findOneWithInvoices(batchId);

  // Load Charge Module summary data
  const chargeModuleSummary = await chargeModuleBatchConnector.send(data.region.chargeRegionId, batchId, true);

  // Map data to Invoice models
  const invoices = data.billingInvoices.map(mappers.invoice.dbToModel);

  // Decorate with Charge Module summary data and CRM company data
  invoices.forEach(invoice => decorateInvoiceWithTotals(invoice, chargeModuleSummary));
  await decorateInvoicesWithCompanies(invoices);
  return invoices;
};

exports.getInvoicesForBatch = getInvoicesForBatch;
exports.getInvoiceForBatch = getInvoiceForBatch;
exports.saveInvoiceToDB = saveInvoiceToDB;
