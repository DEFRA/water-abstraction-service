const Batch = require('../../../../src/lib/models/batch')
const Region = require('../../../../src/lib/models/region')
const Invoice = require('../../../../src/lib/models/invoice')
const InvoiceAccount = require('../../../../src/lib/models/invoice-account')
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence')
const Licence = require('../../../../src/lib/models/licence')
const Transaction = require('../../../../src/lib/models/transaction')
const BillingVolume = require('../../../../src/lib/models/billing-volume')
const ChargeVersion = require('../../../../src/lib/models/charge-version')
const ChargeElement = require('../../../../src/lib/models/charge-element')
const AbstractionPeriod = require('../../../../src/lib/models/abstraction-period')
const DateRange = require('../../../../src/lib/models/date-range')
const FinancialYear = require('../../../../src/lib/models/financial-year')
const User = require('../../../../src/lib/models/user')
const { CHARGE_SEASON } = require('../../../../src/lib/models/constants')
const { omit } = require('lodash')
const createFinancialYear = year => new FinancialYear(year)

const createUser = options => {
  const { id, email } = options
  const user = new User()
  return user.fromHash({ id, email })
}

const createChargeElement = (options = {}) => {
  const chargeElement = new ChargeElement(options.id || '29328315-9b24-473b-bde7-02c60e881501')
  chargeElement.fromHash({
    source: 'supported',
    season: CHARGE_SEASON.summer,
    loss: 'low',
    authorisedAnnualQuantity: 12.5,
    billableAnnualQuantity: null
  })
  chargeElement.abstractionPeriod = new AbstractionPeriod()
  chargeElement.abstractionPeriod.fromHash({
    startDay: 1,
    startMonth: 1,
    endDay: 31,
    endMonth: 12
  })
  return chargeElement
}

const createChargeVersion = chargeElements => {
  const chargeVersion = new ChargeVersion()
  return chargeVersion.fromHash({
    licence: createLicence(),
    chargeElements: chargeElements || [createChargeElement()]
  })
}

const createTransaction = (options = {}, chargeElement) => {
  const transaction = new Transaction(options.id || '')
  return transaction.fromHash({
    chargeElement: chargeElement || createChargeElement(),
    chargePeriod: new DateRange('2019-04-01', '2020-03-31'),
    isCredit: false,
    isCompensationCharge: !!options.isCompensationCharge,
    authorisedDays: 366,
    billableDays: 366,
    description: 'Tiny pond',
    isDeMinimis: options.isDeMinimis || false
  })
}

const createBillingVolume = (options = {}) => {
  const billingVolume = new BillingVolume()
  return billingVolume.fromHash({
    ...omit(options, 'billingVolumeId'),
    id: options.billingVolumeId || '0310af58-bb31-45ec-9a8a-f4a8f8da8ee7',
    chargeElementId: options.chargeElementId || '29328315-9b24-473b-bde7-02c60e881501',
    financialYear: createFinancialYear(options.financialYear || 2018),
    isApproved: false,
    volume: options.volume || 0
  })
}

const createLicence = () => {
  const licence = new Licence()
  licence.fromHash({
    id: '4838e713-9499-4b9d-a7c0-c4c9a008a589',
    licenceNumber: '01/123/ABC',
    isWaterUndertaker: true
  })
  licence.region = new Region()
  licence.region.fromHash({
    type: Region.types.region,
    name: 'Anglian',
    code: 'A',
    numericCode: 3
  })
  licence.regionalChargeArea = new Region()
  licence.regionalChargeArea.fromHash({
    type: Region.types.regionalChargeArea,
    name: 'Anglian'
  })
  licence.historicalArea = new Region()
  licence.historicalArea.fromHash({
    type: Region.types.environmentAgencyArea,
    code: 'ARCA'
  })
  return licence
}

const createInvoiceLicence = (options = {}, licence) => {
  const invoiceLicence = new InvoiceLicence('c4fd4bf6-9565-4ff8-bdba-e49355446d7b')
  invoiceLicence.fromHash(options)
  invoiceLicence.licence = licence || createLicence()
  return invoiceLicence
}

const createInvoice = (options = {}, invoiceLicences) => {
  const invoice = new Invoice()
  const invoiceAccount = new InvoiceAccount()
  invoiceAccount.fromHash({
    accountNumber: 'A12345678A'
  })
  return invoice.fromHash({
    invoiceLicences: invoiceLicences || [createInvoiceLicence()],
    invoiceAccount,
    options,
    financialYear: new FinancialYear(2020)
  })
}

const createBatch = (options = {}, invoice) => {
  const batch = new Batch()
  batch.fromHash(options)
  return batch.addInvoice(invoice || createInvoice())
}

const createTransactionDBRow = (options = {}, chargeElement) => {
  const dbRow = {
    billingTransactionId: options.billingTransactionId || '56bee20e-d65e-4110-bf35-5681e2c73d66',
    isCredit: false,
    isCompensationCharge: !!options.isCompensationCharge,
    authorisedDays: 366,
    billableDays: 366,
    description: 'Tiny pond',
    status: 'candidate',
    startDate: '2019-04-01',
    endDate: '2020-03-31',
    chargeType: 'standard',
    chargeElement: options.chargeElement,
    volume: 5.64,
    section126Factor: null,
    section127Agreement: true,
    section130Agreement: false
  }

  if (options.chargeElementId) {
    return {
      ...omit(dbRow, chargeElement),
      chargeElementId: options.chargeElementId
    }
  }

  return dbRow
}

const createBillingVolumeDBRow = (options = {}) => ({
  billingVolumeId: options.billingVolumeId || '0310af58-bb31-45ec-9a8a-f4a8f8da8ee7',
  chargeElementId: options.chargeElementId || '29328315-9b24-473b-bde7-02c60e881501',
  financialYear: options.financialYear || 2018,
  isApproved: false,
  volume: options.volume || 0
})

exports.createInvoiceLicence = createInvoiceLicence
exports.createInvoice = createInvoice
exports.createTransaction = createTransaction
exports.createBillingVolume = createBillingVolume
exports.createBatch = createBatch
exports.createUser = createUser
exports.createLicence = createLicence
exports.createChargeElement = createChargeElement
exports.createChargeVersion = createChargeVersion
exports.createFinancialYear = createFinancialYear
exports.createTransactionDBRow = createTransactionDBRow
exports.createBillingVolumeDBRow = createBillingVolumeDBRow
