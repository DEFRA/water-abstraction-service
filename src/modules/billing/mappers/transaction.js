'use strict';

const moment = require('moment');
const { titleCase } = require('title-case');
const { get, pick, identity } = require('lodash');

const Batch = require('../../../lib/models/batch');
const DateRange = require('../../../lib/models/date-range');
const Transaction = require('../../../lib/models/transaction');
const Agreement = require('../../../lib/models/agreement');
const User = require('../../../lib/models/user');

const agreement = require('./agreement');
const chargeElementMapper = require('./charge-element');

const getTwoPartTariffTransactionDescription = (batch, chargeElement) => {
  const prefix = batch.isTwoPartTariff() ? 'Second' : 'First';
  const { purposeTertiaryDescription: purpose, description } = chargeElement;

  return `${prefix} part ${purpose} charge at ${description}`;
};

const getTransactionDescription = (batch, chargeLine, chargeElement, isCompensationCharge) => {
  if (isCompensationCharge) {
    return 'Compensation Charge calculated from all factors except Standard Unit Charge and Source (replaced by factors below) and excluding S127 Charge Element';
  }

  const description = chargeLine.section127Agreement
    ? getTwoPartTariffTransactionDescription(batch, chargeElement)
    : chargeElement.description;

  return titleCase(description || '');
};

const createTransaction = (batch, chargeLine, chargeElement, data = {}) => {
  const transaction = new Transaction();
  transaction.fromHash({
    ...data,
    authorisedDays: chargeElement.totalDays,
    billableDays: chargeElement.billableDays,
    agreements: agreement.chargeToModels(chargeLine),
    chargePeriod: new DateRange(chargeLine.startDate, chargeLine.endDate),
    chargeElement: chargeElementMapper.chargeToModel(chargeElement),
    volume: chargeElement.billableAnnualQuantity || chargeElement.authorisedAnnualQuantity
  });
  if (data.twoPartTariffReview) {
    transaction.twoPartTariffReview = mapReviewDataToUser(data.twoPartTariffReview);
  }

  transaction.description = getTransactionDescription(
    batch,
    chargeLine,
    chargeElement,
    data.isCompensationCharge
  );

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
const chargeToModels = (chargeLine, batch) => {
  const { isCompensation, ...transactionData } = getOptions(chargeLine, batch);

  return chargeLine.chargeElements.reduce((acc, chargeElement) => {
    acc.push(createTransaction(batch, chargeLine, chargeElement, {
      ...transactionData,
      isCompensationCharge: false
    }));

    if (isCompensation) {
      acc.push(createTransaction(batch, chargeLine, chargeElement, {
        ...transactionData,
        isCompensationCharge: true
      }));
    }

    return acc;
  }, []);
};

/**
 * Create agreement model with supplied code
 * and optional factor (for abatements)
 * @param {String} code
 * @param {Number} [factor]
 * @return {Agreement}
 */
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
    row.section126Factor !== null && createAgreement('S126', row.section126Factor),
    row.section127Agreement && createAgreement('S127'),
    row.section130Agreement && createAgreement(row.section130Agreement)
  ];
  return agreements.filter(identity);
};

/**
 * Maps json data from DB to User model
 * @param {Object} data user data from DB
 * @return {User}
 */
const mapReviewDataToUser = data => {
  if (!data) return null;
  const user = new User();
  return user.fromHash({
    id: data.id,
    emailAddress: data.emailAddress
  });
};

/**
 * Maps a row from water.billing_transactions to a Transaction model
 * @param {Object} row - from water.billing_transactions, camel cased
 */
const dbToModel = row => {
  const transaction = new Transaction();
  transaction.fromHash({
    id: row.billingTransactionId,
    ...pick(row, ['status', 'isCredit', 'authorisedDays', 'billableDays', 'description', 'transactionKey',
      'externalId', 'calculatedVolume', 'twoPartTariffError', 'twoPartTariffStatus']),
    chargePeriod: new DateRange(row.startDate, row.endDate),
    isCompensationCharge: row.chargeType === 'compensation',
    chargeElement: chargeElementMapper.dbToModel(row.chargeElement),
    volume: parseFloat(row.volume),
    agreements: mapDBToAgreements(row),
    twoPartTariffReview: mapReviewDataToUser(row.twoPartTariffReview)
  });
  return transaction;
};

/**
 * Maps agreements array to fields in water.billing_transactions table
 * @param {Array<Agreement>} agreements
 * @return {Object}
 */
const mapAgreementsToDB = agreements => {
  const twoPartTariffAgreement = agreements.find(agreement => agreement.isTwoPartTariff());
  const abatementAgreement = agreements.find(agreement => agreement.isAbatement());
  const canalAndRiversTrustAgreement = agreements.find(agreement => agreement.isCanalAndRiversTrust());

  return {
    section127Agreement: !!twoPartTariffAgreement,
    section126Factor: abatementAgreement ? abatementAgreement.factor : null,
    section130Agreement: canalAndRiversTrustAgreement ? canalAndRiversTrustAgreement.code : null
  };
};

/**
 * Maps a Transaction instance (with associated InvoiceLicence) to
 * a row of data ready for persistence to water.billing_transactions
 * @param {InvoiceLicence} invoiceLicence
 * @param {Transaction} transaction
 * @return {Object}
 */
const modelToDb = (invoiceLicence, transaction) => ({
  billingInvoiceLicenceId: invoiceLicence.id,
  chargeElementId: transaction.chargeElement.id,
  startDate: transaction.chargePeriod.startDate,
  endDate: transaction.chargePeriod.endDate,
  abstractionPeriod: transaction.chargeElement.abstractionPeriod.toJSON(),
  source: transaction.chargeElement.source,
  season: transaction.chargeElement.season,
  loss: transaction.chargeElement.loss,
  isCredit: transaction.isCredit,
  chargeType: transaction.isCompensationCharge ? 'compensation' : 'standard',
  authorisedQuantity: transaction.chargeElement.authorisedAnnualQuantity,
  billableQuantity: transaction.chargeElement.billableAnnualQuantity,
  authorisedDays: transaction.authorisedDays,
  billableDays: transaction.billableDays,
  description: transaction.description,
  status: transaction.status,
  volume: transaction.volume,
  ...mapAgreementsToDB(transaction.agreements),
  transactionKey: transaction.transactionKey,
  calculatedVolume: transaction.calculatedVolume,
  twoPartTariffError: transaction.twoPartTariffError,
  twoPartTariffStatus: transaction.twoPartTariffStatus,
  twoPartTariffReview: transaction.twoPartTariffReview || null
});

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
const modelToChargeModule = (batch, invoice, invoiceLicence, transaction) => {
  const periodStart = mapChargeModuleDate(transaction.chargePeriod.startDate);
  const periodEnd = mapChargeModuleDate(transaction.chargePeriod.endDate);

  return {
    periodStart,
    periodEnd,
    credit: transaction.isCredit,
    billableDays: transaction.billableDays,
    authorisedDays: transaction.authorisedDays,
    volume: transaction.volume,
    twoPartTariff: batch.type === Batch.BATCH_TYPE.twoPartTariff,
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

exports.chargeToModels = chargeToModels;
exports.dbToModel = dbToModel;
exports.modelToDb = modelToDb;
exports.modelToChargeModule = modelToChargeModule;
