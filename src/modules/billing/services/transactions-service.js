'use strict';

const Transaction = require('../../../lib/models/transaction');
const DateRange = require('../../../lib/models/date-range');

const chargeModuleTransactionsConnector = require('../../../lib/connectors/charge-module/transactions');
const ChargeModuleTransaction = require('../../../lib/models/charge-module-transaction');
const agreeementsService = require('./agreements-service');
const chargeElementsService = require('./charge-elements-service');
const { logger } = require('../../../logger');

const mapTransaction = chargeModuleTransaction => {
  const transaction = new ChargeModuleTransaction(chargeModuleTransaction.id);
  transaction.licenceNumber = chargeModuleTransaction.licenceNumber;
  transaction.accountNumber = chargeModuleTransaction.customerReference;
  transaction.isCredit = chargeModuleTransaction.credit;
  transaction.value = chargeModuleTransaction.chargeValue;
  return transaction;
};

const mapTransactions = chargeModuleTransactions => chargeModuleTransactions.map(mapTransaction);

/**
 * Gets transactions from the charge module for the given batch id
 *
 * @param {String} batchId uuid of the batch to get the charge module transactions for
 * @returns {Array<ChargeModuleTransaction>} A list of charge module transactions
 */
const getTransactionsForBatch = async batchId => {
  try {
    const { data } = await chargeModuleTransactionsConnector.getTransactionQueue(batchId);
    return mapTransactions(data.transactions);
  } catch (err) {
    logger.error('Cannot get transactions from charge module', err);

    // temporary behaviour whilst full intgration is made with charging api
    return [];
  }
};

/**
 * Gets transactions from the charge module for the given invoice and batch id
 *
 * @param {String} batchId uuid of the batch to get the charge module transactions for
 * @returns {Array<ChargeModuleTransaction>} A list of charge module transactions
 */
const getTransactionsForBatchInvoice = async (batchId, invoiceReference) => {
  try {
    const { data } = await chargeModuleTransactionsConnector.getTransactionQueue(batchId, invoiceReference);
    return mapTransactions(data.transactions);
  } catch (err) {
    logger.error('Cannot get transactions from charge module', err);

    // temporary behaviour whilst full intgration is made with charging api
    return [];
  }
};

const createTransaction = (chargeLine, chargeElement, data = {}) => {
  const transaction = new Transaction();
  transaction.fromHash({
    ...data,
    authorisedDays: chargeElement.totalDays,
    billableDays: chargeElement.billableDays,
    agreements: agreeementsService.mapChargeToAgreements(chargeLine),
    chargePeriod: new DateRange(chargeLine.startDate, chargeLine.endDate),
    description: chargeElement.description,
    chargeElement: chargeElementsService.mapRowToModel(chargeElement)
  });
  return transaction;
};

const transactionDefaults = {
  isTwoPartTariffSupplementaryCharge: false,
  isCredit: false
};

/**
 * Generates an array of transactions from a charge line output
 * from the charge processor
 * @param {Object} chargeLine
 * @param {Object} options
 * @param {Boolean} options.isTwoPartTariffSupplementaryCharge
 * @param {Boolean} options.isCredit
 * @param {Boolean} isCompensation - false for water undertakers
 * @return {Array<Transaction>}
 */
const mapChargeToTransactions = (chargeLine, options = {}, isCompensation = true) => {
  const data = Object.assign({}, transactionDefaults, options);

  return chargeLine.chargeElements.reduce((acc, chargeElement) => {
    acc.push(createTransaction(chargeLine, chargeElement, {
      ...data,
      isCompensationCharge: false
    }));

    if (isCompensation) {
      acc.push(createTransaction(chargeLine, chargeElement, {
        ...data,
        isCompensationCharge: true
      }));
    }

    return acc;
  }, []);
};

exports.getTransactionsForBatch = getTransactionsForBatch;
exports.getTransactionsForBatchInvoice = getTransactionsForBatchInvoice;
exports.mapChargeToTransactions = mapChargeToTransactions;
