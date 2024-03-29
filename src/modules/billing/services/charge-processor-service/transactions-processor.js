'use strict'

const MomentRange = require('moment-range')
const moment = MomentRange.extendMoment(require('moment'))

// DEFRA helpers
const helpers = require('@envage/water-abstraction-helpers')

// Service models
const DateRange = require('../../../../lib/models/date-range')
const Transaction = require('../../../../lib/models/transaction')

const { TRANSACTION_TYPE } = require('../../../../lib/models/charge-version-year')
const { getChargePeriod, isNaldTransaction } = require('../../lib/charge-period')

const agreements = require('./lib/agreements')

const DATE_FORMAT = 'YYYY-MM-DD'

const isTwoPartTariffApplied = (agreement, chargeElement) =>
  agreement.isTwoPartTariff() &&
  chargeElement.purposeUse.isTwoPartTariff &&
  chargeElement.isSection127AgreementEnabled
/**
 * Predicate to check whether an agreement should be applied to the transaction
 * @param {Agreement} agreement
 * @param {PurposeUse} purpose
 * @return {Boolean}
 */
const agreementAppliesToTransaction = (agreement, chargeElement) => {
  const isCanalApplied = agreement.isCanalAndRiversTrust()
  return isCanalApplied || isTwoPartTariffApplied(agreement, chargeElement)
}

const getBillableDays = (absPeriod, startDate, endDate, isTwoPartSecondPartCharge) => {
  return isTwoPartSecondPartCharge
    ? 0
    : helpers.charging.getBillableDays(absPeriod, startDate, endDate)
}

/**
 * Creates a Transaction model
 * @param {DateRange} chargePeriod - charge period for this charge element - taking time-limits into account
 * @param {ChargeElement} chargeElement
 * @param {Array<Agreement>} agreements
 * @param {FinancialYear} financialYear
 * @param {Object} flags
 * @param {Boolean} flags.isCompensationCharge
 * @param {Boolean} flags.isTwoPartSecondPartCharge
 * @param {Boolean} flags.isMinimumCharge
 * @return {Transaction}
 */
const createTransaction = (chargePeriod, chargeElement, agreements, financialYear, flags = {}, billingVolume) => {
  const absPeriod = chargeElement.abstractionPeriod.toJSON()
  const transaction = new Transaction()
  transaction.fromHash({
    chargeElement,
    chargePeriod,
    agreements: agreements.filter(agreement => agreementAppliesToTransaction(agreement, chargeElement)),
    status: Transaction.statuses.candidate,
    authorisedDays: getBillableDays(absPeriod, financialYear.start.format(DATE_FORMAT), financialYear.end.format(DATE_FORMAT), flags.isTwoPartSecondPartCharge),
    billableDays: getBillableDays(absPeriod, chargePeriod.startDate, chargePeriod.endDate, flags.isTwoPartSecondPartCharge),
    volume: billingVolume ? billingVolume.volume : chargeElement.volume,
    isTwoPartSecondPartCharge: flags.isTwoPartSecondPartCharge || false,
    isCompensationCharge: flags.isCompensationCharge || false,
    isNewLicence: flags.isMinimumCharge || false
  })
  transaction.createDescription()
  return transaction
}

const createSrocTransactionDescription = (chargeElement, flags) => {
  if (flags.isCompensationCharge) {
    return 'Compensation charge: calculated from the charge reference, activity description and regional environmental improvement charge; excludes any supported source additional charge and two-part tariff charge agreement'
  }
  // if it is a two part tarriff bill run then all transactions are 2nd part charges
  if (flags.isTwoPartSecondPartCharge) {
    return `Two-part tariff supplementary water abstraction charge: ${chargeElement.description}`
  } else { // annual or 1st part charge description
    return chargeElement.adjustments.s127
      ? `Two-part tariff basic water abstraction charge: ${chargeElement.description}`
      : `Water abstraction charge: ${chargeElement.description}`
  }
}

// produce array of date ranges
// sort the array of date ranges in asccending order
// loop through the date ranges and if they overlap then merge the two date ranges
// loop though the list again to calculate the number of days for each date range and add it to the sum

/**
 * Creates a Transaction model
 * @param {DateRange} chargePeriod - charge period for this charge element - taking time-limits into account
 * @param {ChargeElement} chargeElement
 * @param {FinancialYear} financialYear
 * @param {Object} flags
 * @param {Boolean} flags.isCompensationCharge
 * @param {Boolean} flags.isTwoPartSecondPartCharge
 * @param {Boolean} flags.isMinimumCharge
 * @return {Transaction}
 */
const createSrocTransaction = (chargePeriod, chargeElement, financialYear, flags = {}) => {
  const absPeriod = chargeElement.chargePurposes.map(chargePurpose => chargePurpose.abstractionPeriod.toJSON())
  const additionalCharges = chargeElement.additionalCharges
    ? {
        supportedSource: chargeElement.additionalCharges.supportedSource || { name: null },
        isSupplyPublicWater: !!chargeElement.additionalCharges.isSupplyPublicWater
      }
    : {
        supportedSource: { name: null },
        isSupplyPublicWater: false
      }

  return {
    isCredit: false,
    purposes: JSON.stringify(chargeElement.chargePurposes.map(chargePurpose => chargePurpose.toJSON())),
    chargeElementId: chargeElement.id,
    startDate: chargePeriod.startDate,
    endDate: chargePeriod.endDate,
    loss: chargeElement.loss,
    chargeType: flags.isCompensationCharge ? 'compensation' : 'standard',
    authorisedQuantity: chargeElement.volume,
    billableQuantity: chargeElement.volume,
    authorisedDays: getBillableDays(absPeriod, financialYear.start.format(DATE_FORMAT), financialYear.end.format(DATE_FORMAT), flags.isTwoPartSecondPartCharge),
    billableDays: getBillableDays(absPeriod, chargePeriod.startDate, chargePeriod.endDate, flags.isTwoPartSecondPartCharge),
    status: 'candidate',
    description: createSrocTransactionDescription(chargeElement, flags),
    volume: chargeElement.volume, // @TODO this should be the acutal reported volume entered in 2PT review process
    section126Factor: chargeElement.adjustments.s126 || 1,
    section127Agreement: !!chargeElement.adjustments.s127,
    section130Agreement: !!chargeElement.adjustments.s130,
    isWinterOnly: !!chargeElement.adjustments.winter,
    scheme: 'sroc',
    season: 'all year',
    source: chargeElement.source === 'unsupported' ? 'unsupported' : chargeElement.source,
    aggregateFactor: chargeElement.adjustments.aggregate || 1,
    adjustmentFactor: chargeElement.adjustments.charge || 1,
    chargeCategoryCode: chargeElement.chargeCategory.reference,
    chargeCategoryDescription: chargeElement.chargeCategory.shortDescription,
    isSupportedSource: !!additionalCharges.supportedSource.name,
    supportedSourceName: additionalCharges.supportedSource.name,
    isTwoPartSecondPartCharge: flags.isTwoPartSecondPartCharge || false,
    isNewLicence: flags.isMinimumCharge || false,
    isWaterUndertaker: flags.isWaterUndertaker || false, // if this is false then isWaterCompanyCharge can not be true
    isWaterCompanyCharge: additionalCharges.isSupplyPublicWater // this value is set in the UI when assigning a charge category
  }
}

/**
 * Predicate to check whether compensation charges are needed
 * @param {ChargeVersion} chargeVersion
 * @return {Boolean}
 */
const isCompensationChargesNeeded = chargeVersion => !chargeVersion.licence.isWaterUndertaker

const doesChargePeriodStartOnFirstApril = chargePeriodStartDate =>
  chargePeriodStartDate.isSame(moment(`${chargePeriodStartDate.year()}-04-01`, DATE_FORMAT), 'day')

/**
 * Predicate to check whether the minimum charge applies
 * @param {DateRange} chargePeriod of the charge element
 * @param {ChargeVersion} chargeVersion
 * @return {Boolean}
 */
const doesMinimumChargeApply = (chargePeriod, chargeVersion) => {
  const { dateRange, changeReason } = chargeVersion
  const chargePeriodStartDate = moment(chargePeriod.startDate)

  if (isNaldTransaction(chargePeriodStartDate)) {
    return false
  }

  const isSharedStartDate = chargePeriodStartDate.isSame(moment(dateRange.startDate), 'day')
  const triggersMinimumCharge = changeReason?.triggersMinimumCharge ?? false
  const isFirstChargeOnNewLicence = isSharedStartDate && triggersMinimumCharge

  return doesChargePeriodStartOnFirstApril(chargePeriodStartDate) || isFirstChargeOnNewLicence
}

/**
 * Gets the charge period for the element, taking into account the time-limited
 * dates.  If the time limit does not overlap with the supplied period, returns null
 * @param {Object} period
 * @param {String} period.startDate - YYYY-MM-DD
 * @param {String} period.endDate - YYYY-MM-DD
 * @param {ChargeElement} chargeElement
 * @return {DateRange|null}
 */
const getElementChargePeriod = (period, chargeElement) => {
  const { timeLimitedPeriod } = chargeElement

  if (!timeLimitedPeriod) {
    return new DateRange(period.startDate, period.endDate)
  }

  const intersection = helpers.charging.getIntersection([
    [period.startDate, period.endDate],
    [timeLimitedPeriod.startDate, timeLimitedPeriod.endDate]
  ])

  return intersection ? new DateRange(...intersection) : null
}

/**
 * Gets the summer and winter/all year billing volume
 * @param {ChargeElement} chargeElement
 * @param {Array<BillingVolume>} billingVolumes
 */
const getBillingVolumesForChargeElement = (chargeElement, billingVolumes) => billingVolumes.filter(
  billingVolume => billingVolume.chargeElementId === chargeElement.id
)

const hasTwoPartTariffAgreement = (agreements, chargeElement) => {
  const agreementsAreTwoPartTariff = agreements.map(agreement =>
    isTwoPartTariffApplied(agreement, chargeElement))
  return agreementsAreTwoPartTariff.includes(true)
}

/**
 * Create two part tariff transactions
 * @param {Object} elementChargePeriod
 * @param {ChargeElement} chargeElement
 * @param {Array} agreements
 * @param {FinancialYear} financialYear
 * @param {Array<BillingVolume>} additionalData.billingVolumes volumes
 * @return {Array<Transaction>}
 */
const createTwoPartTariffTransactions = (elementChargePeriod, chargeElement, agreements, financialYear, additionalData) => {
  const { billingVolumes } = additionalData
  const transactions = []
  const elementBillingVolumes = getBillingVolumesForChargeElement(chargeElement, billingVolumes)
  elementBillingVolumes.forEach(billingVolume => {
    if (hasTwoPartTariffAgreement(agreements, chargeElement)) {
      transactions.push(createTransaction(elementChargePeriod, chargeElement, agreements, financialYear, { isTwoPartSecondPartCharge: true }, billingVolume))
    }
  })

  return transactions
}

/**
 * Create annual transactions
 * @param {Object} elementChargePeriod
 * @param {ChargeElement} chargeElement
 * @param {Array} agreements
 * @param {FinancialYear} financialYear
 * @param {ChargeVersion} additionalData.chargeVersion volumes
 * @return {Array<Transaction>}
 */
const createAnnualAndCompensationTransactions = (elementChargePeriod, chargeElement, agreements, financialYear, additionalData) => {
  const { chargeVersion } = additionalData
  const isMinimumCharge = doesMinimumChargeApply(elementChargePeriod, chargeVersion)
  const transactions = []
  let flags = { isMinimumCharge }
  if (chargeVersion.scheme === 'alcs') {
    transactions.push(createTransaction(elementChargePeriod, chargeElement, agreements, financialYear, flags))

    if (isCompensationChargesNeeded(chargeVersion)) {
      flags = {
        isMinimumCharge,
        isCompensationCharge: true
      }
      transactions.push(
        createTransaction(elementChargePeriod, chargeElement, agreements, financialYear, flags))
    }
  } else {
    flags = {
      isMinimumCharge,
      isWaterUndertaker: chargeVersion.licence.isWaterUndertaker,
      isTwoPartSecondPartCharge: false
    }
    // set isTwoPartSecondPartCharge flag to false because all annual billing transactions are 1st part charges
    transactions.push(createSrocTransaction(elementChargePeriod, chargeElement, financialYear, flags))

    if (isCompensationChargesNeeded(chargeVersion)) {
      flags = {
        isMinimumCharge,
        isCompensationCharge: true,
        isWaterUndertaker: chargeVersion.licence.isWaterUndertaker
      }
      transactions.push(createSrocTransaction(elementChargePeriod, chargeElement, financialYear, flags))
    }
  }

  // Filter any transactions with 0 billable days
  return transactions.filter(transaction => transaction.billableDays > 0)
}

const actions = {
  [TRANSACTION_TYPE.annual]: createAnnualAndCompensationTransactions,
  [TRANSACTION_TYPE.twoPartTariff]: createTwoPartTariffTransactions
}

const createTransactionsForPeriod = (chargeVersionYear, period, billingVolumes) => {
  const { chargeVersion, financialYear, transactionType } = chargeVersionYear
  const { agreements, dateRange } = period

  return chargeVersion.chargeElements.reduce((acc, chargeElement) => {
    const elementChargePeriod = getElementChargePeriod(dateRange, chargeElement)
    if (!elementChargePeriod) {
      return acc
    }
    const additionalData = { chargeVersion, billingVolumes }
    acc.push(...actions[transactionType](elementChargePeriod, chargeElement, agreements, financialYear, additionalData))
    return acc
  }, [])
}

/**
 * Create two part tariff transactions
 * @param {ChargeVersionYear} chargeVersionYear
 * @param {Array<BillingVolume>} billingVolumes - all billing volumes in DB matching charge element IDs
 * @return {Array<Transaction>}
 */
const createTransactions = (chargeVersionYear, billingVolumes) => {
  const { chargeVersion, financialYear } = chargeVersionYear
  const chargePeriod = getChargePeriod(financialYear, chargeVersion)

  // Create a history for the financial year, taking into account agreements
  const history = agreements.getAgreementsHistory(chargePeriod, chargeVersion.licence.licenceAgreements)

  // Create transactions for each period in the history
  const transactions = history.map(period =>
    createTransactionsForPeriod(chargeVersionYear, period, billingVolumes))

  return transactions.flat(Infinity)
}

exports.createTransactions = createTransactions
