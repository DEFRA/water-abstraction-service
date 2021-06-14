'use strict';

const { get } = require('lodash');

const repos = require('../connectors/repos');
const chargeModuleBillRunApi = require('../../lib/connectors/charge-module/bill-runs');
const batchService = require('../../modules/billing/services/batch-service');
const invoiceService = require('./invoice-service');
const invoicesLicenceService = require('../../modules/billing/services/invoice-licences-service');

const mappers = require('../../modules/billing/mappers');
const { logger } = require('../../logger');
const errors = require('../errors');
const InvoiceLicence = require('../models/invoice-licence');

// const createRebillingTransaction = async(sourceInvoiceLicence, invoiceL);

const createRebillingTransactions = (sourceInvoiceLicence, invoiceLicence, cmInvoice) =>
  Promise.all(sourceInvoiceLicence.transactions.map(
    sourceTransaction => createRebillingTransaction(sourceInvoiceLicence, invoiceLicence, cmInvoice)
  ));

const createRebillingInvoiceLicence = async (sourceInvoiceLicence, rebillingInvoice, cmInvoice) => {
  // Create model
  const invoiceLicence = new InvoiceLicence().pickFrom(
    sourceInvoiceLicence, ['licence', 'transactions']
  );

  // Persist to DB
  const { billingInvoiceLicenceId } = await invoicesLicenceService.saveInvoiceLicenceToDB(rebillingInvoice, invoiceLicence);
  invoiceLicence.id = billingInvoiceLicenceId;

  return createRebillingTransactions(sourceInvoiceLicence, invoiceLicence, cmInvoice);
};

const createRebillingInvoiceLicences = (sourceInvoice, rebillingInvoice, cmInvoice) =>
  sourceInvoice.invoiceLicences.map(
    sourceInvoiceLicence => createRebillingInvoiceLicence(sourceInvoiceLicence, rebillingInvoice, cmInvoice)
  );

const createRebillingInvoice = async (batch, sourceInvoice, cmInvoiceId) => {
  // Load CM invoice
  const { invoice: cmInvoice } = await chargeModuleBillRunApi.getInvoiceTransactions(batch.externalId, cmInvoiceId);

  // Additional properties which should be set on the invoice model
  // to reflect the CM re-billing state
  const invoiceProperties = {
    ...mappers.invoice.cmToPojo(cmInvoice),
    originalInvoiceId: sourceInvoice.id
  };

  // Persist rebilling invoice to DB
  const rebillingInvoice = await invoiceService.getOrCreateInvoice(
    batch.id,
    sourceInvoice.invoiceAccount.id,
    sourceInvoice.financialYear.yearEnding,
    invoiceProperties
  );

  return createRebillingInvoiceLicences(sourceInvoice, rebillingInvoice, cmInvoice);
};

/**
 * Overall rebilling process:
 * - Call CM to generate rebilling (responds with new invoice IDs)
 * - Fetch new CM invoices (transactions include rebilledTransactionId property)
 * - Clone local invoice, update with new external ID and rebilling state
 * - Clone local invoiceLicences
 * - Clone local transactions, update with new external ID
 */

const rebillInvoice = async (batchId, sourceInvoiceId) => {
  try {
    // Load service models
    const batch = await batchService.getBatchById(batchId);
    const sourceInvoice = await invoiceService.getInvoiceById(sourceInvoiceId);

    // Call rebilling Charge Module endpoint
    const { cmInvoices } = await chargeModuleBillRunApi.rebillInvoice(batch.externalId, sourceInvoice.externalId);

    // Create rebilling invoices
    await Promise.all(
      cmInvoices.map(cmInvoice => createRebillingInvoice(batch, sourceInvoice, cmInvoice.id))
    );
  } catch (err) {
    if (isConflictError(err)) {
      logger.info(`Invoice ${sourceInvoiceId} already marked for rebilling in batch ${batchId}`);
      return null;
    } else {
      logger.error(`Failed to mark invoice ${sourceInvoiceId} for rebilling in charge module`, err);
      throw err;
    }
  }
};

const isConflictError = err => get(err, 'response.statusCode') === 409;

// rebillInvoice('4beb0a93-b89d-4911-b4e9-8071751dd414', '3e8c682d-9b25-42af-82b9-e6c0ee665215');

// /**
//  * Rebills the requested invoice
//  *
//  * @param {Batch} batch - the current supplementary batch
//  * @param {Invoice} invoice - the invoice being rebilled from a previous batch
//  * @return {Promise}
//  */
// const rebillInvoice = async (batch, invoice) => {
//   try {

//     const cmResponse = await chargeModuleBillRunApi.rebillInvoice(batch.externalId, invoice.externalId);
//     console.log(cmResponse);
//     await createRebillingInvoices(batch, invoice, cmResponse);
//     return setSourceInvoiceAsRebilled(invoice.id);
//   } catch (err) {
//     if (isConflictError(err)) {
//       logger.info(`Invoice ${invoice.id} already marked for rebilling in batch ${batch.id}`);
//       return null;
//     } else {
//       logger.error(`Failed to mark invoice ${invoice.id} for rebilling in charge module`, err);
//       throw err;
//     }
//   }
// };

// const isConflictError = err => get(err, 'response.statusCode') === 409;

// const createRebillingInvoice = async (batch, invoice, cmInvoice) => {
//   // Additional properties which should be set on the invoice model
//   // to reflect the CM re-billing state
//   const invoiceProperties = {
//     ...mappers.invoice.cmToPojo(cmInvoice),
//     originalInvoiceId: invoice.id
//   };

//   const rebillingInvoice = await invoiceService.getOrCreateInvoice(
//     batch.id,
//     invoice.invoiceAccount.id,
//     invoice.financialYear.yearEnding,
//     invoiceProperties
//   );

//   // @todo clone licences
//   // @todo clone transactions

//   // return rebillingInvoice;
// };

// const createRebillingInvoiceLicences = async (invoice, rebillingInvoice) => {

// };

// /**
//  * Creates the re-billing invoices in the new batch using the external IDs
//  * returned from the CM re-billing API call
//  *
//  * @param {Batch} batch - current supplementary batch being processed
//  * @param {Invoice} invoice - invoice from old batch being re-billed
//  * @param {Object} cmResponse - response from CM re-billing API call
//  * @returns {Promise<Array>} new invoice models
//  */
// const createRebillingInvoices = (batch, invoice, cmResponse) =>
//   cmResponse.invoices.map(cmInvoice => createRebillingInvoice(batch, invoice, cmInvoice));

// /**
//  * Marks an invoice as re-billed.  It does this by setting the originalBillingInvoiceId
//  * field to the same value as the invoice ID
//  *
//  * @param {String} invoiceId
//  * @returns {Promise<Invoice>} the updated Invoice service model
//  */
// const setSourceInvoiceAsRebilled = async invoiceId => {
//   const updatedRow = await repos.billingInvoices.update(invoiceId, {
//     originalBillingInvoiceId: invoiceId,
//     rebillingState: null
//   });
//   return mappers.invoice.dbToModel(updatedRow);
// };

// exports.rebillInvoice = rebillInvoice;
