'use strict'

const {
  assertIsInstanceOf, assertIsArrayOfType,
  assertIsNullableInstanceOf, assertIsBoolean,
  assertNullableString, assertNullableObject,
  assertNullableInteger, assertNullableId,
  assertNullablePositiveOrZeroInteger,
  assertNullableNegativeOrZeroInteger,
  assertIsNullableBoolean,
  assertNullableEnum,
  assertId
} = require('./validators')

const Address = require('./address')
const InvoiceAccount = require('./invoice-account')
const InvoiceLicence = require('./invoice-licence')
const Company = require('./company')
const Contact = require('./contact-v2')
const FinancialYear = require('./financial-year')
const Totals = require('./totals')

const rebillingState = {
  rebill: 'rebill',
  reversal: 'reversal',
  rebilled: 'rebilled',
  unrebillable: 'unrebillable'
}
const rebillingStateLabel = {
  rebill: 'rebill',
  reversal: 'reversal',
  rebilled: 'rebilled',
  unrebillable: 'original',
  original: 'original'
}

class Invoice extends Totals {
  constructor (id) {
    super(id)
    this._invoiceLicences = []
    this.isDeMinimis = false
    this._linkedInvoices = []
  }

  /**
   * Sets the invoice account instance for this invoice
   * @param {InvoiceAccount} invoiceAccount
   */
  set invoiceAccount (invoiceAccount) {
    assertIsInstanceOf(invoiceAccount, InvoiceAccount)
    this._invoiceAccount = invoiceAccount
  }

  /**
   * Gets the invoice account instance for this invoice
   * @return {InvoiceAccount}
   */
  get invoiceAccount () {
    return this._invoiceAccount
  }

  /**
   * Sets the address instance for this invoice
   * @param {Address} address
   */
  set address (address) {
    assertIsInstanceOf(address, Address)
    this._address = address
  }

  /**
   * Gets the address instance for this invoice
   * @return {Address}
   */
  get address () {
    return this._address
  }

  /**
   * Sets the agent company
   * @param {Company} company
   */
  set agentCompany (company) {
    assertIsNullableInstanceOf(company, Company)
    this._agentCompany = company
  }

  /**
   * Gets the agent company
   * @return {Company}
   */
  get agentCompany () {
    return this._agentCompany
  }

  /**
   * Sets the contact - for FAO
   * @param {Contact} contact
   */
  set contact (contact) {
    assertIsNullableInstanceOf(contact, Contact)
    this._contact = contact
  }

  /**
   * Gets the agent company
   * @return {Contact}
   */
  get contact () {
    return this._contact
  }

  /**
   * Sets the date created for this invoice
   * @param {String} dateCreated
   */
  set dateCreated (dateCreated) {
    this._dateCreated = dateCreated
  }

  /**
   * Gets the date created for this invoice
   * @return {String}
   */
  get dateCreated () {
    return this._dateCreated
  }

  set invoiceLicences (invoiceLicences) {
    assertIsArrayOfType(invoiceLicences, InvoiceLicence)
    this._invoiceLicences = invoiceLicences
  }

  get invoiceLicences () {
    return this._invoiceLicences
  }

  /**
   * Gets the invoice licence with specified licence number
   * @param {String} licenceNumber
   * @return {InvoiceLicence|undefined}
   */
  getInvoiceLicenceByLicenceNumber (licenceNumber) {
    return this._invoiceLicences.find(
      invoiceLicence => invoiceLicence.licence.licenceNumber === licenceNumber
    )
  }

  /**
   * Get the licence numbers for this invoice by inspecting
   * the Licence objects associated with each InvoiceLicence
   * object associated with this invoice
   */
  getLicenceNumbers () {
    return this.invoiceLicences.flatMap(invoiceLicence => {
      return invoiceLicence.licence.licenceNumber
    })
  }

  /**
   * Get the licence ids for this invoice by inspecting
   * the Licence objects associated with each InvoiceLicence
   * object associated with this invoice
   * Creating a new set to remove duplicate values
   */
  getLicenceIds () {
    return [...new Set(this.invoiceLicences.flatMap(invoiceLicence => {
      return invoiceLicence.licence.id
    }))]
  }

  /**
   * Sets the financial year
   * @param {FinancialYear} financialYear
   */
  set financialYear (financialYear) {
    assertIsInstanceOf(financialYear, FinancialYear)
    this._financialYear = financialYear
  }

  get financialYear () {
    return this._financialYear
  }

  /**
   * Whether de-minimis rules is applied
   * This occurs when invoice/credit note value < £5
   * @param {Boolean} isDeMinimis
   */
  set isDeMinimis (isDeMinimis) {
    assertIsBoolean(isDeMinimis)
    this._isDeMinimis = isDeMinimis
  }

  get isDeMinimis () {
    return this._isDeMinimis
  }

  /**
   * Sets the invoice number
   * @param {String} invoiceNumber
   */
  set invoiceNumber (invoiceNumber) {
    assertNullableString(invoiceNumber)
    this._invoiceNumber = invoiceNumber
  }

  get invoiceNumber () {
    return this._invoiceNumber
  }

  /**
   * Sets the net total
   * @param {Integer} netTotal
   */
  set netTotal (netTotal) {
    assertNullableInteger(netTotal)
    this._netTotal = netTotal === null ? null : parseInt(netTotal)
  }

  get netTotal () {
    return this._netTotal
  }

  /**
   * Sets the isCredit flag
   * @param {Boolean} isCredit
   */
  set isCredit (isCredit) {
    assertIsNullableBoolean(isCredit)
    this._isCredit = isCredit
  }

  get isCredit () {
    return this._isCredit
  }

  /**
   * Sets the legacy id
   * @param {String} legacyId
   */
  set legacyId (legacyId) {
    assertNullableString(legacyId)
    this._legacyId = legacyId
  }

  get legacyId () {
    return this._legacyId
  }

  /**
   * Sets the metadata
   * @param {Object} metadata
   */
  set metadata (metadata) {
    assertNullableObject(metadata)
    this._metadata = metadata
  }

  get metadata () {
    return this._metadata
  }

  /**
   * Sets the invoice value
   * @param {Integer} invoiceValue
   */
  set invoiceValue (invoiceValue) {
    assertNullablePositiveOrZeroInteger(invoiceValue)
    this._invoiceValue = invoiceValue
  }

  get invoiceValue () {
    return this._invoiceValue
  }

  /**
   * Sets the credit note value
   * @param {Integer} creditNoteValue
   */
  set creditNoteValue (creditNoteValue) {
    assertNullableNegativeOrZeroInteger(creditNoteValue)
    this._creditNoteValue = creditNoteValue
  }

  get creditNoteValue () {
    return this._creditNoteValue
  }

  get hasTransactionErrors () {
    return this.invoiceLicences.some(invoiceLicence => invoiceLicence.hasTransactionErrors)
  }

  /**
   * Sets the external ID.  This is the invoice ID in the charge module.
   */
  get externalId () {
    return this._externalId
  }

  set externalId (externalId) {
    assertNullableId(externalId)
    this._externalId = externalId
  }

  get billingBatchId () {
    return this._billingBatchId
  }

  /**
   * Sets the batch ID.
   */
  set billingBatchId (billingBatchId) {
    assertId(billingBatchId)
    this._billingBatchId = billingBatchId
  }

  /**
   * Sets the isFlaggedForRebilling flag
   * @param {Boolean} isFlaggedForRebilling
   */
  set isFlaggedForRebilling (isFlaggedForRebilling) {
    assertIsNullableBoolean(isFlaggedForRebilling)
    this._isFlaggedForRebilling = isFlaggedForRebilling
  }

  get isFlaggedForRebilling () {
    return this._isFlaggedForRebilling
  }

  get displayLabel () {
    if (this.invoiceNumber) {
      return this.invoiceNumber
    }
    if (this.isDeMinimis) {
      return 'De minimis bill'
    }
    if (this.legacyId) {
      return 'NALD revised bill'
    }
    if (this.netTotal === 0) {
      return 'Zero value bill'
    }
    // Prevents an error being thrown if there is an unexpected case
    return null
  }

  /**
   * sets the rebilling state label only used by the UI
   */
  set rebillingStateLabel (value) {
    assertNullableEnum(value, Object.keys(rebillingStateLabel))
    this._rebillingStateLabel = value
  }

  get rebillingStateLabel () {
    return this._rebillingStateLabel
  }

  toJSON () {
    const { hasTransactionErrors, displayLabel } = this
    return {
      hasTransactionErrors,
      displayLabel,
      ...super.toJSON()
    }
  }

  /**
   * Records whether this invoice is:
   * - reversal - reverses a previous sent bill for rebilling
   * - rebill - a fresh copy of the previously sent bill for rebilling
   *
   * @param {String} value  - reversal|rebill
   */
  set rebillingState (value) {
    assertNullableEnum(value, Object.values(rebillingState))
    this._rebillingState = value
  }

  get rebillingState () {
    return this._rebillingState
  }

  /**
   * The ID of the original bill for rebilling
   * @param {String|Null} id - guid
   */
  set originalInvoiceId (id) {
    assertNullableId(id)
    this._originalInvoiceId = id
  }

  get originalInvoiceId () {
    return this._originalInvoiceId
  }

  /**
   * The ID of the original bill for rebilling
   * @param {String|Null} id - guid
   */
  set linkedInvoices (invoices) {
    assertIsArrayOfType(invoices, Invoice)
    this._linkedInvoices = invoices
  }

  get linkedInvoices () {
    return this._linkedInvoices
  }
}

module.exports = Invoice
module.exports.rebillingState = rebillingState
