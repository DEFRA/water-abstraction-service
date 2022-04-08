'use strict';

const moment = require('moment');
const { titleCase } = require('title-case');
const { identity, get, isNull } = require('lodash');
const helpers = require('@envage/water-abstraction-helpers').charging;

const DateRange = require('../../../lib/models/date-range');
const Transaction = require('../../../lib/models/transaction');
const Agreement = require('../../../lib/models/agreement');

const { SCHEME } = require('../../../lib/models/constants');

const chargeElementMapper = require('../../../lib/mappers/charge-element');
const billingVolumeMapper = require('./billing-volume');
const abstractionPeriodMapper = require('../../../lib/mappers/abstraction-period');

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
    'isTwoPartSecondPartCharge',
    'isDeMinimis',
    'isNewLicence',
    'calcSeasonFactor',
    'calcLossFactor',
    'calcEiucSourceFactor',
    'calcSourceFactor',
    'calcEiucFactor',
    'calcSucFactor',
    'isCreditedBack'
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
  .map('volume').to('volume', volume => isNull(volume) ? null : parseFloat(volume))
  .map().to('agreements', mapDBToAgreements)
  .map(['billingVolume', 'endDate', 'season']).to('billingVolume',
    (billingVolume, endDate, season) => billingVolume ? getBillingVolumeForTransaction({ billingVolume, endDate, season }) : null)
  .map('abstractionPeriod').to('abstractionPeriod', abstractionPeriodMapper.pojoToModel);

const dbToModelMapperSroc = createMapper()
  .copy(
    'status',
    'isCredit',
    'authorisedDays',
    'billableDays',
    'description',
    'externalId',
    'isTwoPartSecondPartCharge',
    'isDeMinimis',
    'isNewLicence',
    'isCreditedBack',
    'isWaterCompanyCharge'

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
  .map('volume').to('volume', volume => isNull(volume) ? null : parseFloat(volume))
  .map('abstractionPeriod').to('abstractionPeriod', abstractionPeriodMapper.pojoToModel);

/**
 * Converts DB representation to a Transaction service model
 * @param {Object} row
 * @return {Transaction}
 */
const dbToModel = row => {
  return row.scheme === 'alcs'
    ? createModel(Transaction, row, dbToModelMapper)
    : createModel(Transaction, row, dbToModelMapperSroc);
};

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
    'isTwoPartSecondPartCharge',
    'isNewLicence',
    'externalId',
    'calcSourceFactor',
    'calcSeasonFactor',
    'calcLossFactor',
    'calcSucFactor',
    'calcEiucFactor',
    'calcEiucSourceFactor',
    'isCreditedBack'
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
const modelToChargeModuleAlcs = (batch, invoice, invoiceLicence, transaction) => {
  const periodStart = mapChargeModuleDate(transaction.chargePeriod.startDate);
  const periodEnd = mapChargeModuleDate(transaction.chargePeriod.endDate);

  return {
    ruleset: 'presroc',
    clientId: transaction.id,
    periodStart,
    periodEnd,
    credit: transaction.isCredit,
    billableDays: transaction.billableDays,
    authorisedDays: transaction.authorisedDays,
    volume: transaction.volume,
    twoPartTariff: transaction.isTwoPartSecondPartCharge,
    compensationCharge: transaction.isCompensationCharge,
    ...mapAgreementsToChargeModule(transaction),
    customerReference: invoice.invoiceAccount.accountNumber,
    lineDescription: transaction.description,
    chargePeriod: `${periodStart} - ${periodEnd}`,
    batchNumber: batch.id,
    ...mapChargeElementToChargeModuleTransaction(transaction.chargeElement),
    ...mapLicenceToChargeElementTransaction(invoiceLicence.licence),
    subjectToMinimumCharge: !transaction.isTwoPartSecondPartCharge
  };
};

/**
 * Maps service models to Charge Module transaction data that
 * can be used to generate a charge
 * @param {Batch} batch
 * @param {Invoice} invoice
 * @param {InvoiceLicence} invoiceLicence
 * @param {Transaction} transaction
 * @return {Object}
 */
const modelToChargeModuleSroc = (batch, invoice, invoiceLicence, transaction) => {
  const periodStart = mapChargeModuleDate(transaction.chargePeriod.startDate);
  const periodEnd = mapChargeModuleDate(transaction.chargePeriod.endDate);
  const licence = invoiceLicence.licence;

  // const chargeElement.adjustments = {
  //   charge: 0.5 todo
  // };

  return {
    periodStart,
    periodEnd,
    ruleset: SCHEME.sroc,
    credit: !!transaction.isCredit,
    abatementFactor: parseFloat(transaction.chargeElement.adjustments.s126),
    authorisedVolume: transaction.chargeElement.volume,
    // ToDo: For 2PartTariff SROC Bill run, the billing volume should be used for actualVolume instead of chargeElement volume
    actualVolume: transaction.chargeElement.volume,
    aggregateProportion: transaction.chargeElement.adjustments.aggregate | 1,
    areaCode: licence.historicalArea.code,
    authorisedDays: transaction.authorisedDays,
    batchNumber: batch.id,
    billableDays: transaction.billableDays,
    chargeCategoryCode: transaction.chargeElement.chargeCategory.reference,
    chargeCategoryDescription: transaction.chargeElement.chargeCategory.shortDescription,
    chargePeriod: `${periodStart} - ${periodEnd}`,
    clientId: transaction.id,
    compensationCharge: transaction.isCompensationCharge,
    customerReference: invoice.invoiceAccount.accountNumber,
    licenceNumber: licence.licenceNumber,
    lineDescription: transaction.description,
    loss: transaction.chargeElement.loss,
    region: licence.region.code,
    regionalChargingArea: licence.regionalChargeArea.name,
    section127Agreement: transaction.chargeElement.adjustments.s127,
    section130Agreement: transaction.chargeElement.adjustments.s130,
    supportedSource: !!transaction.chargeElement.additionalCharges.supportedSource.name,
    supportedSourceName: transaction.chargeElement.additionalCharges.supportedSource.name,
    twoPartTariff: false, // todo - transaction.isTwoPartSecondPartCharge this will indicate to the CM it is the 2nd part charge for 2PT licence
    waterCompanyCharge: transaction.isWaterCompanyCharge,
    waterUndertaker: transaction.chargeElement.additionalCharges.isSupplyPublicWater,
    winterOnly: !!transaction.chargeElement.adjustments.winter
  };
};

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
  .map('twoPartTariff').to('isTwoPartSecondPartCharge')
  .map('transactionStatus').to('status', mapCMTransactionStatus)
  .map('calculation.WRLSChargingResponse.sourceFactor').to('calcSourceFactor')
  .map('calculation.WRLSChargingResponse.seasonFactor').to('calcSeasonFactor')
  .map('calculation.WRLSChargingResponse.lossFactor').to('calcLossFactor')
  .map('calculation.WRLSChargingResponse.sucFactor').to('calcSucFactor')
  .map('calculation.WRLSChargingResponse.abatementAdjustment').to('calcS126Factor')
  .map('calculation.WRLSChargingResponse.s127Agreement').to('calcS127Factor')
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

const cmToDb = cmTransaction => modelToDbMapper.execute(
  cmToPojo(cmTransaction)
);

const inverseCreditNoteSign = transaction => {
  if (transaction.credit === true) {
    transaction.chargeValue = -Math.abs(transaction.chargeValue);
  }
  return transaction;
};

exports.dbToModel = dbToModel;
exports.modelToDb = modelToDb;
exports.modelToChargeModule = modelToChargeModuleAlcs;
exports.modelToChargeModuleSroc = modelToChargeModuleSroc;
exports.cmToModel = cmToModel;
exports.cmToPojo = cmToPojo;
exports.cmToDb = cmToDb;
exports.inverseCreditNoteSign = inverseCreditNoteSign;
