'use strict';

const moment = require('moment');
const { titleCase } = require('title-case');
const { identity, get } = require('lodash');
const helpers = require('@envage/water-abstraction-helpers').charging;

const DateRange = require('../../../lib/models/date-range');
const Transaction = require('../../../lib/models/transaction');
const Agreement = require('../../../lib/models/agreement');

const chargeElementMapper = require('../../../lib/mappers/charge-element');
const billingVolumeMapper = require('./billing-volume');

const { createMapper } = require('../../../lib/object-mapper');
const { createModel } = require('../../../lib/mappers/lib/helpers');

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

const doesVolumeMatchTransaction = (volume, transaction) => {
  const transactionFinancialYear = helpers.getFinancialYear(transaction.endDate);
  const isSummerTransaction = transaction.season === 'summer';

  const financialYearsMatch = parseInt(volume.financialYear) === parseInt(transactionFinancialYear);
  const seasonsMatch = isSummerTransaction === volume.isSummer;

  return financialYearsMatch && seasonsMatch;
};

const getBillingVolumeForTransaction = row => {
  const relevantBillingVolume = row.billingVolume.find(volume => doesVolumeMatchTransaction(volume, row));
  return relevantBillingVolume ? billingVolumeMapper.dbToModel(relevantBillingVolume) : null;
};

const isValueEqualTo = testValue => value => testValue === value;

/**
 * Maps a row from water.billing_transactions to a Transaction model
 * @param {Object} row - from water.billing_transactions, camel cased
 */
const dbToModelMapper = createMapper()
  .copy(
    'status',
    'isCredit',
    'authorisedDays',
    'billableDays',
    'description',
    'externalId',
    'isTwoPartTariffSupplementary',
    'isDeMinimis',
    'isNewLicence',
    'calcSeasonFactor',
    'calcLossFactor',
    'calcEiucSourceFactor',
    'calcSourceFactor',
    'calcEiucFactor',
    'calcSucFactor'
  )
  .map('calcS126Factor').to('calcS126FactorValue')
  .map('calcS127Factor').to('calcS127FactorValue')
  .map('netAmount').to('value')
  .map('billingTransactionId').to('id')
  .map('batchType').to('type')
  .map(['startDate', 'endDate']).to('chargePeriod', (startDate, endDate) => new DateRange(startDate, endDate))
  .map('chargeType').to('isCompensationCharge', isValueEqualTo('compensation'))
  .map('chargeType').to('isMinimumCharge', isValueEqualTo('minimum_charge'))
  .map('chargeElement').to('chargeElement', chargeElementMapper.dbToModel)
  .map('volume').to('volume', volume => volume ? parseFloat(volume) : null)
  .map().to('agreements', mapDBToAgreements)
  .map(['billingVolume', 'endDate', 'season']).to('billingVolume',
    (billingVolume, endDate, season) => billingVolume ? getBillingVolumeForTransaction({ billingVolume, endDate, season }) : null);

/**
 * Converts DB representation to a Transaction service model
 * @param {Object} row
 * @return {Transaction}
 */
const dbToModel = row =>
  createModel(Transaction, row, dbToModelMapper);

const mapChargeType = (isCompensationCharge, isMinimumCharge) => {
  if (isCompensationCharge) {
    return 'compensation';
  }
  if (isMinimumCharge) {
    return 'minimum_charge';
  }
  return 'standard';
};

const isSection127Agreement = agreements => !!agreements.find(agreement => agreement.isTwoPartTariff());

const getSection126Factor = agreements => get(agreements.find(agreement => agreement.isAbatement()), 'factor', null);

const getSection130Agreement = agreements => get(agreements.find(agreement => agreement.isCanalAndRiversTrust()), 'code', null);

const modelToDbMapper = createMapper()
  .copy(
    'isCredit',
    'authorisedDays',
    'billableDays',
    'description',
    'status',
    'volume',
    'isTwoPartTariffSupplementary',
    'isNewLicence',
    'externalId',
    'calcSourceFactor',
    'calcSeasonFactor',
    'calcLossFactor',
    'calcSucFactor',
    'calcEiucFactor',
    'calcEiucSourceFactor'
  )
  .map('chargeElement.id').to('chargeElementId')
  .map('chargePeriod.startDate').to('startDate')
  .map('chargePeriod.endDate').to('endDate')
  .map('chargeElement.abstractionPeriod').to('abstractionPeriod', absPeriod => absPeriod.toJSON())
  .map('chargeElement.source').to('source')
  .map('chargeElement.season').to('season')
  .map('chargeElement.loss').to('loss')
  .map('chargeElement.authorisedAnnualQuantity').to('authorisedQuantity')
  .map('chargeElement.billableAnnualQuantity').to('billableQuantity')
  .map(['isCompensationCharge', 'isMinimumCharge']).to('chargeType', mapChargeType)
  .map('agreements').to('section127Agreement', isSection127Agreement)
  .map('agreements').to('section126Factor', getSection126Factor)
  .map('agreements').to('section130Agreement', getSection130Agreement)
  .map('calcS126Factor').to('calcS126Factor', value => value ? value.split(' x ')[1] || null : null)
  .map('calcS127Factor').to('calcS127Factor', value => value ? value.split(' x ')[1] || null : null)
  .map('value').to('netAmount');

/**
 * Maps a Transaction instance (with associated InvoiceLicence) to
 * a row of data ready for persistence to water.billing_transactions
 * @param {InvoiceLicence} invoiceLicence
 * @param {Transaction} transaction
 * @return {Object}
 */
const modelToDb = (invoiceLicence, transaction) => ({
  billingInvoiceLicenceId: invoiceLicence.id,
  ...modelToDbMapper.execute(transaction)
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
    clientId: transaction.id,
    periodStart,
    periodEnd,
    credit: transaction.isCredit,
    billableDays: transaction.billableDays,
    authorisedDays: transaction.authorisedDays,
    volume: transaction.volume,
    twoPartTariff: transaction.isTwoPartTariffSupplementary,
    compensationCharge: transaction.isCompensationCharge,
    ...mapAgreementsToChargeModule(transaction),
    customerReference: invoice.invoiceAccount.accountNumber,
    lineDescription: transaction.description,
    chargePeriod: `${periodStart} - ${periodEnd}`,
    batchNumber: batch.id,
    ...mapChargeElementToChargeModuleTransaction(transaction.chargeElement),
    ...mapLicenceToChargeElementTransaction(invoiceLicence.licence),
    subjectToMinimumCharge: transaction.isNewLicence
  };
};

const mapIsTwoPartTariffSupplementary = twoPartTariff => twoPartTariff === true;

const cmStatusMap = new Map([
  ['unbilled', Transaction.statuses.chargeCreated]
]);

const mapCMTransactionStatus = cmStatus => cmStatusMap.get(cmStatus);

/**
 * Creates a Transaction model for Minimum Charge transaction
 * returned from the Charge Module
 * @param {Object} data CM transaction
 */
const cmToModelMapper = createMapper()
  .map('id').to('externalId')
  .map('chargeValue').to('value')
  .map('credit').to('isCredit')
  .map('lineDescription').to('description')
  .map('compensationCharge').to('isCompensationCharge')
  .map('minimumChargeAdjustment').to('isMinimumCharge')
  .map('deminimis').to('isDeMinimis')
  .map('subjectToMinimumCharge').to('isNewLicence')
  .map('twoPartTariff').to('isTwoPartTariffSupplementary', mapIsTwoPartTariffSupplementary)
  .map('transactionStatus').to('status', mapCMTransactionStatus)
  .map('calculation.WRLSChargingResponse.sourceFactor').to('calcSourceFactor')
  .map('calculation.WRLSChargingResponse.seasonFactor').to('calcSeasonFactor')
  .map('calculation.WRLSChargingResponse.lossFactor').to('calcLossFactor')
  .map('calculation.WRLSChargingResponse.sucFactor').to('calcSucFactor')
  .map('calculation.WRLSChargingResponse.abatementAdjustment').to('calcS126Factor', val => val ? `S126 x ${val}` : null)
  .map('calculation.WRLSChargingResponse.s127Agreement').to('calcS127Factor', val => val ? `S127 x ${val}` : null)
  .map('calculation.WRLSChargingResponse.eiucFactor').to('calcEiucFactor')
  .map('calculation.WRLSChargingResponse.eiucSourceFactor').to('calcEiucSourceFactor');

/**
 * Converts Minimum Charge transaction returned from the CM
 * to a Transaction service model
 * @param {Object} data
 * @return {Transaction}
 */
const cmToModel = data =>
  createModel(Transaction, data, cmToModelMapper);

const cmToPojo = cmTransaction => cmToModelMapper.execute(cmTransaction);

exports.dbToModel = dbToModel;
exports.modelToDb = modelToDb;
exports.modelToChargeModule = modelToChargeModule;
exports.cmToModel = cmToModel;
exports.cmToPojo = cmToPojo;
