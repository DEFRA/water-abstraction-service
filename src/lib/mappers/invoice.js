'use strict'

const Invoice = require('../models/invoice')
const InvoiceAccount = require('../models/invoice-account')
const FinancialYear = require('../models/financial-year')

const invoiceAccount = require('./invoice-account')
const invoiceLicence = require('../../modules/billing/mappers/invoice-licence')
const batchMapper = require('../../lib/mappers/batch')

const { createMapper } = require('../object-mapper')
const { createModel } = require('./lib/helpers')

const mapLinkedInvoices = (billingInvoiceId, linkedBillingInvoices = [], originalBillingInvoice = {}) => {
  const invoices = linkedBillingInvoices
    .filter(linkedBillingInvoice => ![billingInvoiceId, originalBillingInvoice.billingInvoiceId].includes(linkedBillingInvoice.billingInvoiceId))
    .map(dbToModel)

  let isNotEmpty

  if ((originalBillingInvoice === null) || (Object.keys(originalBillingInvoice).length === 0)) {
    isNotEmpty = false
  } else {
    isNotEmpty = true
  }

  if (isNotEmpty && billingInvoiceId !== originalBillingInvoice.billingInvoiceId) {
    invoices.push(dbToModel(originalBillingInvoice))
  }
  return invoices
}

const dbToModelMapper = createMapper()
  .copy(
    'dateCreated',
    'invoiceNumber',
    'isCredit',
    'isDeMinimis',
    'invoiceValue',
    'creditNoteValue',
    'externalId',
    'legacyId',
    'metadata',
    'isFlaggedForRebilling',
    'rebillingState',
    'billingBatchId'
  )
  .map('netAmount').to('netTotal')
  .map('billingInvoiceId').to('id')
  .map('invoiceAccountId').to('invoiceAccount', invoiceAccountId => new InvoiceAccount(invoiceAccountId))
  .map('invoiceAccountNumber').to('invoiceAccount.accountNumber')
  .map('billingInvoiceLicences').to('invoiceLicences', billingInvoiceLicences => billingInvoiceLicences.map(invoiceLicence.dbToModel))
  .map('billingBatch').to('batch', batchMapper.dbToModel)
  .map('financialYearEnding').to('financialYear', financialYearEnding => new FinancialYear(financialYearEnding))
  .map('originalBillingInvoiceId').to('originalInvoiceId')
  .map('rebillingState').to('rebillingStateLabel')
  .map(['billingInvoiceId', 'linkedBillingInvoices', 'originalBillingInvoice']).to('linkedInvoices', mapLinkedInvoices)

/**
 * Converts DB representation to a Invoice service model
 * @param {Object} row
 * @return {Invoice}
 */
const dbToModel = row => {
  const invoice = createModel(Invoice, row, dbToModelMapper)
  return getRebillingStateLabels(invoice)
}

/**
 * Corrects the rebilling state label when a rebilled invoice has been rebilled again
 * @param {Invoice} invoice the invoice service model
 * @returns Invoice service model with corrected rebilling state labels for the UI
 */
const getRebillingStateLabels = invoice => {
  if (invoice.rebillingState === 'rebilled' && invoice.originalInvoiceId === invoice.id) {
    invoice.rebillingStateLabel = 'original'
    return invoice
  }
  if (invoice.linkedInvoices.length > 0) {
    if (invoice.linkedInvoices[0].rebillingStateLabel === 'rebilled' && invoice.linkedInvoices[0].originalInvoiceId === invoice.id) {
      invoice.linkedInvoices[0].rebillingStateLabel = 'original'
      return invoice
    } else {
      invoice.linkedInvoices[1].rebillingStateLabel = 'original'
      return invoice
    }
  }
  return invoice
}

const mapAddress = (invoice, scheme = 'alcs') => {
  // sroc invoices are not mapped to the internal models so does not have the toJSON function.
  const result = scheme === 'alcs' ? invoice?.address.toJSON() : { ...invoice?.address }
  delete result?.id

  return result
}

/**
 * Maps data from an Invoice model to the correct shape for water.billing_invoices
 * @param {Batch} batch
 * @param {Invoice} invoice
 * @return {Object}
 */
const modelToDb = (invoice, scheme) => ({
  externalId: invoice.externalId || null,
  invoiceAccountId: invoice.invoiceAccount.id,
  invoiceAccountNumber: invoice.invoiceAccount.accountNumber,
  address: invoice.address ? mapAddress(invoice, scheme) : {},
  financialYearEnding: invoice.financialYear.endYear,
  invoiceNumber: invoice.invoiceNumber || null,
  isCredit: invoice.netTotal === null ? null : invoice.netTotal < 0,
  isDeMinimis: invoice.isDeMinimis,
  netAmount: invoice.netTotal,
  invoiceValue: invoice.invoiceValue,
  creditNoteValue: invoice.creditNoteValue,
  isFlaggedForRebilling: invoice.isFlaggedForRebilling,
  rebillingState: invoice.rebillingState,
  originalBillingInvoiceId: invoice.originalInvoiceId
})

const crmToModel = row => {
  const invoice = new Invoice()

  // Create invoice account model
  invoice.invoiceAccount = invoiceAccount.crmToModel(row)

  // Get last address from invoice account
  const { lastInvoiceAccountAddress } = invoice.invoiceAccount
  if (lastInvoiceAccountAddress) {
    const { address, agentCompany, contact } = lastInvoiceAccountAddress
    invoice.fromHash({
      address,
      agentCompany: agentCompany || null,
      contact: contact || null
    })
  }

  return invoice
}

/**
  * Gets transaction reference from cmTransactions
  * NB. it is not guaranteed to be present in all transactions
  * @param {Array<Object>} cmTransactions
  */
const getInvoiceNumber = cmTransactions => {
  const transactionsWithRef = cmTransactions.filter(trans => trans.transactionReference !== null)
  return transactionsWithRef[0] ? transactionsWithRef[0].transactionReference : null
}

const cmRebilledTypes = new Map()
  .set('C', 'reversal')
  .set('R', 'rebill')
  .set('O', null)

const cmToPojoMapper = createMapper()
  .map('id').to('externalId')
  .copy('netTotal')
  .map('deminimisInvoice').to('isDeMinimis')
  .map('debitLineValue').to('invoiceValue')
  .map('creditLineValue').to('creditNoteValue', value => -value)
  .map('rebilledType').to('rebillingState', value => cmRebilledTypes.get(value))

/**
 * Maps Charge Module invoice data to POJO model with WRLS naming
 *
 * @param {Object} cmInvoiceSummary
 * @param {Array} cmTransactions
 * @returns {Object}
 */
const cmToPojo = (cmInvoiceSummary, cmTransactions = []) => ({
  ...cmToPojoMapper.execute(cmInvoiceSummary),
  invoiceNumber: getInvoiceNumber(cmTransactions)
})

exports.dbToModel = dbToModel
exports.modelToDb = modelToDb
exports.crmToModel = crmToModel
exports.cmToPojo = cmToPojo
