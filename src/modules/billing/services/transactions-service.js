'use strict';

const Transaction = require('../../../lib/models/transaction');
const Batch = require('../../../lib/models/batch');
const { BatchStatusError, TransactionStatusError } = require('../lib/errors');
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

const batchIsTwoPartTariff = batch => batch.isTwoPartTariff();
const batchIsInReviewStatus = batch => batch.statusIsOneOf(Batch.BATCH_STATUS.review);
const transactionIsCandidate = transaction => transaction.status === Transaction.statuses.candidate;

const volumeUpdateErrors = [
  new BatchStatusError('Batch type must be two part tariff'),
  new BatchStatusError('Batch must have review status'),
  new TransactionStatusError('Transaction must have candidate status')
];

/**
* Validates batch, transaction and submitted volume
* Checks that:
* - the batch is a two part tariff
* - the batch is in review status
* - the transaction is in candidate status
*
* Throws error with corresponding message if criteria is not met
*
* @param  {Batch} batch   for the transaction
* @param  {Transaction} transaction   in question
* @param  {Integer} volume   to update transaction with
* @param  {Object} user   id and email of internal user making the update
*/
const updateTransactionVolume = async (batch, transaction, volume) => {
  const flags = [batchIsTwoPartTariff(batch), batchIsInReviewStatus(batch), transactionIsCandidate(transaction)];
  if (flags.includes(false)) throw volumeUpdateErrors[flags.indexOf(false)];

  const { attributes: data } = await newRepos.billingTransactions.update(transaction.id, { volume });

  transaction.volume = data.volume;
  return transaction;
};

exports.saveTransactionToDB = saveTransactionToDB;
exports.getById = getById;
exports.updateWithChargeModuleResponse = updateTransactionWithChargeModuleResponse;
exports.setErrorStatus = setErrorStatus;
exports.updateTransactionVolume = updateTransactionVolume;
