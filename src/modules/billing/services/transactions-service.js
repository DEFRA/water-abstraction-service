'use strict';

const Transaction = require('../../../lib/models/transaction');

const { logger } = require('../../../logger');
const newRepos = require('../../../lib/connectors/repos');
const mappers = require('../mappers');
const { get } = require('lodash');

/**
 * Saves a row to water.billing_transactions for the given Transaction
 * instance
 * @param {InvoiceLicence} invoiceLicence
 * @param {Transaction} transaction
 * @return {Promise}
 */
const saveTransactionToDB = (invoiceLicence, transaction) => {
  const data = mappers.transaction.modelToDb(invoiceLicence, transaction);
  return newRepos.billingTransactions.create(data);
};

/**
 * Gets a transaction in its context within a batch
 * @param {String} transactionId
 * @return {Promise<Batch>}
 */
const getById = async transactionId => {
  const data = await newRepos.billingTransactions.findOne(transactionId);

  // Create models
  const batch = mappers.batch.dbToModel(data.billingInvoiceLicence.billingInvoice.billingBatch);
  const invoice = mappers.invoice.dbToModel(data.billingInvoiceLicence.billingInvoice);
  const invoiceLicence = mappers.invoiceLicence.dbToModel(data.billingInvoiceLicence);
  const licence = mappers.licence.dbToModel(data.billingInvoiceLicence.licence);
  const transaction = mappers.transaction.dbToModel(data);

  // Place in heirarchy
  invoiceLicence.transactions = [transaction];
  invoice.invoiceLicences = [invoiceLicence];
  invoiceLicence.licence = licence;
  batch.invoices = [
    invoice
  ];

  return batch;
};

/**
 * Updates a transaction using the response from the Charge Module
 * create charge API endpoint
 * Either:
 * - the transaction is created successfully, in which case
 *   the charge module transaction ID is stored
 * - a zero value charge is calculated, in which case the
 *   transaction is deleted.
 *
 * @param {String} transactionId
 * @param {Object} response
 */
const updateTransactionWithChargeModuleResponse = (transactionId, response) => {
  const externalId = get(response, 'transaction.id');
  if (externalId) {
    return newRepos.billingTransactions.update(transactionId, {
      status: Transaction.statuses.chargeCreated,
      externalId
    });
  }
  if (get(response, 'status') === 'Zero value charge calculated') {
    return newRepos.billingTransactions.delete(transactionId);
  }
  const err = new Error('Charge module error');
  logger.error('Unexpected create transaction response from charge module', err, { transactionId, response });
  throw err;
};

const setErrorStatus = transactionId =>
  newRepos.billingTransactions.update(transactionId, {
    status: Transaction.statuses.error
  });

const updateTransactionVolume = (transaction) => {
  const changes = {
    ...transaction.pick('volume', 'twoPartTariffError'),
    twoPartTariffReview: transaction.twoPartTariffReview.toJSON()
  };

  return newRepos.billingTransactions.update(transaction.id, changes);
};

exports.saveTransactionToDB = saveTransactionToDB;
exports.getById = getById;
exports.updateWithChargeModuleResponse = updateTransactionWithChargeModuleResponse;
exports.setErrorStatus = setErrorStatus;
exports.updateTransactionVolume = updateTransactionVolume;
