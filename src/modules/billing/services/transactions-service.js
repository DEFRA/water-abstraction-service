'use strict';
const moment = require('moment');
const { identity, get } = require('lodash');
const { titleCase } = require('title-case');
const Agreement = require('../../../lib/models/agreement');
const Batch = require('../../../lib/models/batch');
const Transaction = require('../../../lib/models/transaction');
const DateRange = require('../../../lib/models/date-range');

const chargeModuleTransactionsConnector = require('../../../lib/connectors/charge-module/transactions');
const ChargeModuleTransaction = require('../../../lib/models/charge-module-transaction');
const agreementsService = require('./agreements-service');
const chargeElementsService = require('./charge-elements-service');
const { logger } = require('../../../logger');
const repos = require('../../../lib/connectors/repository');

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
    agreements: agreementsService.mapChargeToAgreements(chargeLine),
    chargePeriod: new DateRange(chargeLine.startDate, chargeLine.endDate),
    description: chargeElement.description,
    chargeElement: chargeElementsService.mapRowToModel(chargeElement),
    volume: chargeElement.billableAnnualQuantity || chargeElement.authorisedAnnualQuantity
  });
  return transaction;
};

const getOptions = (chargeLine, batch) => {
  // @TODO handle credits
  const isWaterUndertaker = get(chargeLine, 'chargeVersion.isWaterUndertaker', false);
  const isTwoPartTariffSupplementaryCharge = batch.type === 'two_part_tariff';
  return {
    isCredit: false,
    isCompensation: !(isWaterUndertaker || isTwoPartTariffSupplementaryCharge),
    isTwoPartTariffSupplementaryCharge
  };
};

/**
 * Generates an array of transactions from a charge line output
 * from the charge processor
 * @param {Object} chargeLine
 * @param {Batch} batch - the current batch instance
 * @return {Array<Transaction>}
 */
const mapChargeToTransactions = (chargeLine, batch) => {
  const { isCompensation, ...transactionData } = getOptions(chargeLine, batch);

  return chargeLine.chargeElements.reduce((acc, chargeElement) => {
    acc.push(createTransaction(chargeLine, chargeElement, {
      ...transactionData,
      isCompensationCharge: false
    }));

    if (isCompensation) {
      acc.push(createTransaction(chargeLine, chargeElement, {
        ...transactionData,
        isCompensationCharge: true
      }));
    }

    return acc;
  }, []);
};

/**
 * Maps agreements array to fields in water.billing_transactions table
 * @param {Array<Agreement>} agreements
 * @return {Object}
 */
const mapAgreementsToDB = agreements => {
  const skeleton = {
    section_127_agreement: false,
    section_126_factor: 1,
    section_130_agreement: null
  };

  return agreements.reduce((acc, agreement) => {
    if (agreement.code === 'S127') {
      acc.section_127_agreement = true;
    }
    if (agreement.code === 'S126') {
      acc.section_126_factor = agreement.factor;
    }
    if (agreement.code.startsWith('S130')) {
      acc.section_130_agreement = agreement.code;
    }
    return acc;
  }, skeleton);
};

/**
 * Maps a Transaction instance (with associated InvoiceLicence) to
 * a row of data ready for persistence to water.billing_transactions
 * @param {InvoiceLicence} invoiceLicence
 * @param {Transaction} transaction
 * @return {Object}
 */
const mapTransactionToDB = (invoiceLicence, transaction) => ({
  billing_invoice_licence_id: invoiceLicence.id,
  charge_element_id: transaction.chargeElement.id,
  start_date: transaction.chargePeriod.startDate,
  end_date: transaction.chargePeriod.endDate,
  abstraction_period: transaction.chargeElement.abstractionPeriod.toJSON(),
  source: transaction.chargeElement.source,
  season: transaction.chargeElement.season,
  loss: transaction.chargeElement.loss,
  is_credit: transaction.isCredit,
  charge_type: transaction.isCompensationCharge ? 'compensation' : 'standard',
  authorised_quantity: transaction.chargeElement.authorisedAnnualQuantity,
  billable_quantity: transaction.chargeElement.billableAnnualQuantity,
  authorised_days: transaction.authorisedDays,
  billable_days: transaction.billableDays,
  description: transaction.description,
  status: transaction.status,
  volume: transaction.volume,
  ...mapAgreementsToDB(transaction.agreements)
});

const createAgreement = (code, factor) => {
  const agreement = new Agreement();
  agreement.fromHash({
    code,
    ...(factor !== undefined && { factor })
  });
  return agreement;
};

/**
 * Maps a DB row to an array of Agreement models
 * @param {Object} row - from water.billing_transactions
 * @return {Array<Agreement>}
 */
const mapDBToAgreements = row => {
  const agreements = [
    row.section_126_factor !== null && createAgreement('S126', row.section_126_factor),
    row.section_127_agreement && createAgreement('S127'),
    row.section_130_agreement && createAgreement(row.section_130_agreement)
  ];
  return agreements.filter(identity);
};

/**
 * Maps a row from water.billing_transactions to a Transaction model
 * @param {Object} row - from water.billing_transactions
 * @param {ChargeElement} chargeElement
 */
const mapDBToModel = (row, chargeElement) => {
  const transaction = new Transaction();
  transaction.fromHash({
    id: row.billing_transaction_id,
    status: row.status,
    isCredit: row.is_credit,
    authorisedDays: row.authorised_days,
    billableDays: row.billable_days,
    chargePeriod: new DateRange(row.start_date, row.end_date),
    isCompensationCharge: row.charge_type === 'compensation',
    description: row.description,
    chargeElement,
    volume: parseFloat(row.volume),
    agreements: mapDBToAgreements(row)
  });
  return transaction;
};

/**
 * Saves a row to water.billing_transactions for the given Transaction
 * instance
 * @param {InvoiceLicence} invoiceLicence
 * @param {Transaction} transaction
 * @return {Promise}
 */
const saveTransactionToDB = (invoiceLicence, transaction) => {
  const data = mapTransactionToDB(invoiceLicence, transaction);
  return repos.billingTransactions.create(data);
};

const DATE_FORMAT = 'YYYY-MM-DD';
const CM_DATE_FORMAT = 'DD-MMM-YYYY';

/**
 * Converts a service date to a Charge Module date
 * @param {String} str - ISO date YYYY-MM-DD
 * @return {String} Charge Module format date, DD-MMM-YYYY
 */
const mapChargeModuleDate = str =>
  moment(str, DATE_FORMAT).format(CM_DATE_FORMAT).toUpperCase();

/**
 * Gets all charge agreement variables/flags from transaction
 * for Charge Module
 * @param {Transaction} transaction
 * @return {Object}
 */
const mapAgreementsToChargeModule = transaction => {
  const section130Agreement = ['S130U', 'S130S', 'S130T', 'S130W']
    .map(code => transaction.getAgreementByCode(code))
    .some(identity);
  const section126Agreement = transaction.getAgreementByCode('S126');
  return {
    section126Factor: section126Agreement ? section126Agreement.factor : 1,
    section127Agreement: !!transaction.getAgreementByCode('S127'),
    section130Agreement
  };
};

/**
 * Gets all charge agreement variables from ChargeElement
 * for Charge Module
 * @param {ChargeElement} chargeElement
 * @return {Object}
 */
const mapChargeElementToChargeModuleTransaction = chargeElement => ({
  source: titleCase(chargeElement.source),
  season: titleCase(chargeElement.season),
  loss: titleCase(chargeElement.loss),
  eiucSource: titleCase(chargeElement.eiucSource),
  chargeElementId: chargeElement.id
});

/**
 * Gets all charge agreement variables from Licence
 * for Charge Module
 * @param {Licence} licence
 * @return {Object}
 */
const mapLicenceToChargeElementTransaction = licence => ({
  waterUndertaker: licence.isWaterUndertaker,
  regionalChargingArea: licence.regionalChargeArea.name, // @TODO
  licenceNumber: licence.licenceNumber,
  region: licence.region.code,
  areaCode: licence.historicalArea.code
});

/**
 * Maps service models to Charge Module transaction data that
 * can be used to generate a charge
 * @param {Batch} batch
 * @param {Invoice} invoice
 * @param {InvoiceLicence} invoiceLicence
 * @param {Transaction} transaction
 * @return {Object}
 */
const mapModelToChargeModule = (batch, invoice, invoiceLicence, transaction) => {
  const periodStart = mapChargeModuleDate(transaction.chargePeriod.startDate);
  const periodEnd = mapChargeModuleDate(transaction.chargePeriod.endDate);

  return {
    periodStart,
    periodEnd,
    credit: transaction.isCredit,
    billableDays: transaction.billableDays,
    authorisedDays: transaction.authorisedDays,
    volume: transaction.volume,
    twoPartTariff: batch.type === Batch.types.twoPartTariff,
    compensationCharge: transaction.isCompensationCharge,
    ...mapAgreementsToChargeModule(transaction),
    customerReference: invoice.invoiceAccount.accountNumber,
    lineDescription: transaction.description,
    chargePeriod: `${periodStart} - ${periodEnd}`,
    batchNumber: batch.id,
    ...mapChargeElementToChargeModuleTransaction(transaction.chargeElement),
    ...mapLicenceToChargeElementTransaction(invoiceLicence.licence)
  };
};

exports.getTransactionsForBatch = getTransactionsForBatch;
exports.getTransactionsForBatchInvoice = getTransactionsForBatchInvoice;
exports.mapChargeToTransactions = mapChargeToTransactions;
exports.mapTransactionToDB = mapTransactionToDB;
exports.mapDBToModel = mapDBToModel;
exports.saveTransactionToDB = saveTransactionToDB;
exports.mapModelToChargeModule = mapModelToChargeModule;
