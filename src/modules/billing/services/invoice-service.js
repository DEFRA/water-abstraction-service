'use strict';

const { first, uniqBy, omit } = require('lodash');

const repos = require('../../../lib/connectors/repository');

// Services
const transactionsService = require('./transactions-service');
const invoiceAccountsService = require('./invoice-accounts-service');
const addressService = require('./address-service');
const invoiceLicencesService = require('./invoice-licences-service');

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
const decorateInvoicesWithCompanies = async (invoices) => {
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
 * Finds all invoices and their licences for the given batch, then
 * overlays the transactions found from the charge-module, and the
 * contacts from the CRM
 *
 * @param {String} batchId UUID of the batch to find invoices for
 */
const getInvoicesForBatch = async batchId => {
  const batchInvoiceRows = await repos.billingInvoices.findByBatchId(batchId);
  const chargeModuleTransactions = await transactionsService.getTransactionsForBatch(batchId);

  const models = createInvoiceModelsFromBatchInvoiceRows(batchInvoiceRows);

  return decorateInvoices(models, chargeModuleTransactions);
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

const getInvoiceAccountNumber = row => row.invoiceAccount.invoiceAccount.invoiceAccountNumber;

/**
 * Maps output data from charge processor into an array of unique invoice licences
 * matching the invoice account number of the supplied Invoice instance
 * @param {Invoice} invoice - invoice instance
 * @param {Array} data - processed charge versions
 * @param {Batch} batch - current batch model
 * @return {Array<InvoiceLicence>}
 */
const mapInvoiceLicences = (invoice, data, batch) => {
  // Find rows with invoice account number that match the supplied invoice
  const { accountNumber } = invoice.invoiceAccount;
  const filtered = data.filter(row => getInvoiceAccountNumber(row) === accountNumber);
  // Create array of InvoiceLicences
  const invoiceLicences = filtered.map(invoiceLicencesService.mapChargeRowToModel);
  // @todo attach transactions to InvoiceLicences
  // Return a unique list
  return uniqBy(invoiceLicences, invoiceLicence => invoiceLicence.uniqueId);
};

/**
 * Given an array of data output from the charge processor,
 * maps it to an array of Invoice instances
 * @param {Array} data - output from charge processor
 * @param {Batch} batch
 * @return {Array<Invoice>}
 */
const mapChargeDataToModels = (data, batch) => {
  // Create unique list of invoice accounts within data
  const rows = uniqBy(
    data.map(row => row.invoiceAccount),
    row => row.invoiceAccount.invoiceAccountId
  );

  // Map to invoice models
  return rows.map(row => {
    const invoice = new Invoice();

    // Create invoice account model
    invoice.invoiceAccount = invoiceAccountsService.mapCRMInvoiceAccountToModel(row.invoiceAccount);

    // Create invoice address model
    invoice.address = addressService.mapCRMAddressToModel(row.address);

    // Create invoiceLicences array
    invoice.invoiceLicences = mapInvoiceLicences(invoice, data, batch);

    return invoice;
  });
};

/**
 * Maps data from an Invoice model to the correct shape for water.billing_invoices
 * @param {Batch} batch
 * @param {Invoice} invoice
 * @return {Object}
 */
const mapModelToDB = (batch, invoice) => ({
  invoice_account_id: invoice.invoiceAccount.id,
  invoice_account_number: invoice.invoiceAccount.accountNumber,
  address: omit(invoice.address.toObject(), 'id'),
  billing_batch_id: batch.id
});

/**
 * Saves an Invoice model to water.billing_invoices
 * @param {Batch} batch
 * @param {Invoice} invoice
 * @return {Promise<Object>} row data inserted
 */
const saveInvoiceToDB = async (batch, invoice) => {
  const data = mapModelToDB(batch, invoice);
  const { rows: [row] } = await repos.billingInvoices.create(data);
  return row;
};

exports.getInvoicesForBatch = getInvoicesForBatch;
exports.getInvoiceForBatch = getInvoiceForBatch;
exports.mapChargeDataToModels = mapChargeDataToModels;
exports.saveInvoiceToDB = saveInvoiceToDB;
