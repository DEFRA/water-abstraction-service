'use strict'

const { v4: uuid } = require('uuid')
const Agreement = require('../../../../../src/lib/models/agreement')
const AbstractionPeriod = require('../../../../../src/lib/models/abstraction-period')
const Batch = require('../../../../../src/lib/models/batch')
const BillingVolume = require('../../../../../src/lib/models/billing-volume')
const Company = require('../../../../../src/lib/models/company')
const ChargeElement = require('../../../../../src/lib/models/charge-element')
const ChargeVersion = require('../../../../../src/lib/models/charge-version')
const ChargePurpose = require('../../../../../src/lib/models/charge-purpose')
const ChargeCategory = require('../../../../../src/lib/models/charge-category')
const DateRange = require('../../../../../src/lib/models/date-range')
const InvoiceAccount = require('../../../../../src/lib/models/invoice-account')
const Invoice = require('../../../../../src/lib/models/invoice')
const InvoiceLicence = require('../../../../../src/lib/models/invoice-licence')
const Licence = require('../../../../../src/lib/models/licence')
const LicenceAgreement = require('../../../../../src/lib/models/licence-agreement')
const FinancialYear = require('../../../../../src/lib/models/financial-year')
const Region = require('../../../../../src/lib/models/region')
const Transaction = require('../../../../../src/lib/models/transaction')
const PurposeUse = require('../../../../../src/lib/models/purpose-use')
const ChangeReason = require('../../../../../src/lib/models/change-reason')
const ChargeVersionYear = require('../../../../../src/lib/models/charge-version-year')

const createLicence = (overrides = {}) => {
  const licence = new Licence()
  return licence.fromHash({
    licenceNumber: '01/134',
    startDate: overrides.startDate || '2000-01-01',
    expiryDate: overrides.expiryDate || null,
    revokedDate: overrides.revokedDate || null,
    lapsedDate: overrides.lapsedDate || null,
    licenceAgreements: [],
    isWaterUndertaker: overrides.isWaterUndertaker || false
  })
}

const createChargeVersion = (overrides = {}) => {
  const chargeVersion = new ChargeVersion(uuid())
  chargeVersion.company = new Company(uuid())
  chargeVersion.invoiceAccount = new InvoiceAccount(uuid())
  chargeVersion.changeReason = new ChangeReason(uuid())
  chargeVersion.changeReason.triggersMinimumCharge = overrides.triggersMinimumCharge || false
  chargeVersion.licence = createLicence({ startDate: overrides.licenceStartDate })
  chargeVersion.chargeElements = [createChargeElement(overrides)]
  chargeVersion.scheme = 'alcs'
  return chargeVersion.fromHash({
    dateRange: new DateRange(overrides.startDate || '2000-01-01', overrides.endDate || null),
    ...overrides
  })
}

const createChargeElement = (overrides = {}) => {
  overrides.scheme = overrides.scheme ? overrides.scheme : 'alcs'
  const abstractionPeriod = new AbstractionPeriod()
  let chargePurpose, chargeCategory

  abstractionPeriod.fromHash(overrides.abstractionPeriod || {
    startDay: 1,
    startMonth: 1,
    endDay: 31,
    endMonth: 12
  })

  if (overrides.scheme === 'sroc') {
    chargePurpose = new ChargePurpose(uuid())
    chargePurpose.abstractionPeriod = abstractionPeriod
    chargeCategory = new ChargeCategory(uuid())
    chargeCategory.reference = 'charge-category-ref'
  } else {
    chargePurpose = null
    chargeCategory = null
  }

  const purposeData = overrides.isSprayIrrigation
    ? { code: '400', name: 'Spray Irrigation Direct', isTwoPartTariff: true }
    : { code: '300', name: 'Mineral washing', isTwoPartTariff: false }

  const purpose = new PurposeUse()
  purpose.fromHash(purposeData)

  const chargeElement = new ChargeElement()

  if (overrides.timeLimitedStartDate && overrides.timeLimitedEndDate) {
    chargeElement.timeLimitedPeriod = new DateRange(overrides.timeLimitedStartDate, overrides.timeLimitedEndDate)
  }

  chargeElement.fromHash({
    id: overrides.id || '00000000-0000-0000-0000-000000000000',
    description: 'Test description',
    source: 'supported',
    season: 'summer',
    loss: 'medium',
    authorisedAnnualQuantity: 10.4,
    billableAnnualQuantity: 8.43,
    abstractionPeriod: overrides.scheme === 'alcs' ? abstractionPeriod : null,
    purposeUse: purpose,
    isSection127AgreementEnabled: true,
    scheme: overrides.scheme || 'alcs',
    chargeCategory
  })
  if (overrides.scheme === 'sroc') {
    chargeElement.chargePurposes = [chargePurpose]
    chargeElement.adjustments = { s127: true }
    chargeElement.source = 'tidal'
  }
  return chargeElement
}

const createFinancialYear = year => new FinancialYear(year || 2020)

const createBatch = (type, options = {}) => {
  const batch = new Batch()
  return batch.fromHash({
    type,
    region: new Region(uuid(), 'region'),
    ...options
  })
}

const createLicenceAgreement = (overrides = {}) => {
  // Create agreement
  const agreement = new Agreement()
  agreement.code = overrides.code || 'S127'
  // Create date range
  const dateRange = new DateRange(overrides.startDate || '2000-01-01', overrides.endDate || null)
  const licenceAgreement = new LicenceAgreement()
  return licenceAgreement.fromHash({
    dateRange,
    agreement,
    dateDeleted: null
  })
}

const createChargeVersionWithTwoPartTariff = (overrides = {}) => {
  const cv = createChargeVersion(overrides)
  cv.licence = createLicence()
  cv.chargeElements = [
    createChargeElement({ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }),
    createChargeElement({ isSprayIrrigation: true })
  ]
  cv.licence.licenceAgreements = [
    createLicenceAgreement()
  ]
  return cv
}

const createSrocChargeVersion = (overrides = {}) => {
  const cv = createChargeVersion({ scheme: 'sroc', ...overrides })
  const chargeElement = createChargeElement({ scheme: 'sroc', isSprayIrrigation: true })
  chargeElement.adjustments = {
    s127: false,
    s126: 0.7,
    aggregate: 0.8,
    charge: 0.9
  }
  chargeElement.additionalCharges = {
    supportedSource: { name: 'test-source-name' },
    isSupplyPublicWater: true
  }
  chargeElement.source = 'unsupported'
  cv.chargeElements.push(chargeElement)
  cv.licence = createLicence()
  return cv
}

const createTransaction = (options = {}) => {
  const transaction = new Transaction()
  return transaction.fromHash({
    authorisedDays: 150,
    billableDays: 150,
    chargeElement: createChargeElement(),
    ...options
  })
}

const createInvoice = () => {
  const invoiceLicence = new InvoiceLicence()
  invoiceLicence.licence = createLicence()

  const invoiceAccount = new InvoiceAccount()
  invoiceAccount.accountNumber = 'A12345678A'

  const invoice = new Invoice()
  return invoice.fromHash({
    invoiceAccount,
    invoiceLicences: [invoiceLicence],
    financialYear: new FinancialYear(2019)
  })
}

const createSentTPTBatches = () => {
  const invoice = createInvoice()
  const summerBatch = createBatch('two_part_tariff', { isSummer: true })
  summerBatch.addInvoice(invoice)
  return [
    summerBatch,
    createBatch('two_part_tariff', { isSummer: false, invoices: [invoice] })
  ]
}

const createBillingVolume = chargeElement => {
  const billingVolume = new BillingVolume(uuid())
  return billingVolume.fromHash({
    chargeElement,
    chargeElementId: chargeElement.id,
    volume: 10
  })
}

const createChargeVersionYear = (batch, chargeVersion, financialYear, options = {}) => {
  const chargeVersionYear = new ChargeVersionYear(uuid())
  return chargeVersionYear.fromHash({
    batch,
    chargeVersion,
    financialYear,
    transactionType: options.transactionType || 'annual',
    isSummer: options.isSummer || false
  })
}

exports.createLicence = createLicence
exports.createChargeVersion = createChargeVersion
exports.createChargeElement = createChargeElement
exports.createFinancialYear = createFinancialYear
exports.createBatch = createBatch
exports.createLicenceAgreement = createLicenceAgreement
exports.createChargeVersionWithTwoPartTariff = createChargeVersionWithTwoPartTariff
exports.createTransaction = createTransaction
exports.createSentTPTBatches = createSentTPTBatches
exports.createBillingVolume = createBillingVolume
exports.createChargeVersionYear = createChargeVersionYear
exports.createSrocChargeVersion = createSrocChargeVersion
