const Batch = require('../../../lib/models/batch');
const Transaction = require('../../../lib/models/transaction');
const User = require('../../../lib/models/user');
const { negate, cond } = require('lodash');
const Boom = require('@hapi/boom');

const volumeUpdateErrors = {
  ERR_INCORRECT_BATCH_TYPE: 'Batch type must be two part tariff',
  ERR_INCORRECT_BATCH_STATUS: 'Batch must have review status',
  ERR_INCORRECT_TRANSACTION_STATUS: 'Transaction must have candidate status',
  ERR_INVALID_VOLUME: 'Volume must be less than or equal to the authorised annual quantity'
};

const batchIsTwoPartTariff = batch => batch.isTwoPartTariff();

const batchIsInReviewStatus = batch => batch.statusIsOneOf(Batch.BATCH_STATUS.review);

const transactionIsCandidate = (batch, transaction) => Transaction.statuses.candidate === transaction.status;

const volumeLessThanAuthorised = (batch, transaction, volume) => {
  const authorisedAnnualVolume = transaction.chargeElement.billableAnnualQuantity || transaction.chargeElement.authorisedAnnualQuantity;
  return volume <= authorisedAnnualVolume;
};

/**
 * Creates a pair for use in the lodash cond function, in the form:
 * [predicate, func]
 * @param  {Function} predicate
 * @param  {String} error - error message
 * @return {Array} [predicate, func]
 */
const createPair = (predicate, error) => {
  return [negate(predicate), () => error];
};

/**
   * Creates a validator which returns an error message for the first validation
   * test that fails
   * @type {Function}
   */
const validator = cond([
  createPair(batchIsTwoPartTariff, volumeUpdateErrors.ERR_INCORRECT_BATCH_TYPE),
  createPair(batchIsInReviewStatus, volumeUpdateErrors.ERR_INCORRECT_BATCH_STATUS),
  createPair(transactionIsCandidate, volumeUpdateErrors.ERR_INCORRECT_TRANSACTION_STATUS),
  createPair(volumeLessThanAuthorised, volumeUpdateErrors.ERR_INVALID_VOLUME)
]);

/**
 * Validates batch, transaction and submitted volume
 * Checks that:
 * - the batch is a two part tariff
 * - the batch is in review status
 * - the transaction is in candidate status
 * - the volume is less than or equal to the authorised quantity
 *
 * Throws Boom.badRequest if the validator returns an error
 *
 * @param  {Batch} batch   containing the transaction
 * @param  {Integer} volume   to update transaction with
 */
const checkVolumeUpdateCriteriaMet = (batch, volume) => {
  const { invoices: [{ invoiceLicences: [{ transactions: [transaction] }] }] } = batch;
  const error = validator(batch, transaction, volume);
  if (error) throw Boom.badRequest(error);
};

/**
 * Decorates the transaction with:
 * - the updated volume
 * - twoPartTariffError set to false
 * - twoPartTariffReview User model of internal user
 *
 * @param {Batch} batch    containing the transaction to update
 * @param {Integer} volume    to update transaction with
 * @param {Object} reviewer    internal user who is making the request
 * @return {Transaction}
 */
const decorateTransactionWithVolume = (batch, volume, reviewer) => {
  const { invoices: [{ invoiceLicences: [{ transactions: [transaction] }] }] } = batch;
  const user = new User();

  return transaction.fromHash({
    volume,
    twoPartTariffError: false,
    twoPartTariffReview: user.fromHash({
      id: reviewer.id,
      emailAddress: reviewer.email
    })
  });
};

exports.checkVolumeUpdateCriteriaMet = checkVolumeUpdateCriteriaMet;
exports.volumeUpdateErrors = volumeUpdateErrors;
exports.decorateTransactionWithVolume = decorateTransactionWithVolume;
