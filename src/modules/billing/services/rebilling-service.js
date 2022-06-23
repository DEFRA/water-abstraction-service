'use strict'

const promiseRetry = require('promise-retry')

const { logger } = require('../../../logger')

// Models
const Transaction = require('../../../lib/models/transaction')

// Services
const chargeModuleBillRunApi = require('../../../lib/connectors/charge-module/bill-runs')
const invoiceService = require('../../../lib/services/invoice-service')
const invoiceLicenceService = require('./invoice-licences-service')
const transactionService = require('./transactions-service')

// Mappers
const invoiceMapper = require('../../../lib/mappers/invoice')
const transactionMapper = require('../mappers/transaction')

const rebillInvoice = async (batch, sourceInvoiceId) => {
  const sourceInvoice = await invoiceService.getInvoiceById(sourceInvoiceId)

  try {
    const { invoices: cmInvoices } = await chargeModuleBillRunApi.rebillInvoice(batch.externalId, sourceInvoice.externalId)

    await isChargeModuleReady(batch)

    for (const cmInvoice of cmInvoices) {
      await createInvoice(batch, sourceInvoice, cmInvoice.id)
    }
  } catch (err) {
    logger.error(`Failed to mark invoice ${sourceInvoice.id} for rebilling in charge module`)
    throw err
  }
}

const isChargeModuleReady = async batch => {
  const cmReadyStatus = 'initialised'

  const promiseRetryOptions = {
    retries: 5,
    factor: 3,
    minTimeout: 3 * 1000,
    randomize: true
  }

  const func = async (retry, number) => {
    const { status } = await chargeModuleBillRunApi.getStatus(batch.externalId)

    // Log message
    const errorMessage = `Batch ${batch.id} rebilling - CM batch status ${status} attempt ${number}`
    logger.log('info', errorMessage)

    // If status not "initialised", retry() will try again
    if (status !== cmReadyStatus) {
      return retry(new Error(errorMessage))
    }
    return true
  }

  return promiseRetry(func, promiseRetryOptions)
}

const createInvoice = async (batch, sourceInvoice, cmInvoiceId) => {
  logger.info(`Rebilling: processing CM invoice ${cmInvoiceId}`)

  const { invoice: cmInvoice } = await chargeModuleBillRunApi.getInvoiceTransactions(batch.externalId, cmInvoiceId)

  // Additional properties which should be set on the invoice model
  // to reflect the CM re-billing state
  const invoiceData = {
    ...invoiceMapper.cmToPojo(cmInvoice),
    originalInvoiceId: sourceInvoice.id
  }

  // Create the new rebill invoice
  const rebilledInvoice = await invoiceService.createInvoice(
    batch.id,
    sourceInvoice.invoiceAccount.id,
    sourceInvoice.financialYear.yearEnding,
    invoiceData
  )

  return createInvoiceLicences(sourceInvoice, rebilledInvoice, cmInvoice)
}

const createInvoiceLicences = async (sourceInvoice, rebilledInvoice, cmInvoice) => {
  for (const sourceInvoiceLicence of sourceInvoice.invoiceLicences) {
    const cmLicence = getCMLicenceByLicenceNumber(cmInvoice, sourceInvoiceLicence.licence.licenceNumber)
    await createInvoiceLicence(rebilledInvoice, sourceInvoiceLicence, cmLicence)
  }
}

const getCMLicenceByLicenceNumber = (cmInvoice, licenceNumber) => cmInvoice.licences.find(
  row => row.licenceNumber === licenceNumber
)

const createInvoiceLicence = async (rebilledInvoice, sourceInvoiceLicence, cmLicence) => {
  const rebillInvoiceLicence = await invoiceLicenceService.saveInvoiceLicenceToDB(rebilledInvoice, sourceInvoiceLicence)
  return createTransactions(rebillInvoiceLicence, sourceInvoiceLicence, cmLicence)
}

const createTransactions = async (rebillInvoiceLicence, sourceInvoiceLicence, cmLicence) => {
  for (const sourceTransaction of sourceInvoiceLicence.transactions) {
    // Find CM transaction
    const cmTransaction = getCMTransactionByRebilledTransactionId(cmLicence, sourceTransaction.externalId)

    // Create rebill transaction service model
    const rebillTransaction = new Transaction()
      .fromHash(sourceTransaction)
      .fromHash(transactionMapper.cmToPojo(cmTransaction))
      .clearId()

    // Persist
    await transactionService.saveTransactionToDB(rebillInvoiceLicence, rebillTransaction)
  }
}

const getCMTransactionByRebilledTransactionId = (cmLicence, id) => cmLicence.transactions.find(
  row => row.rebilledTransactionId === id
)

exports.rebillInvoice = rebillInvoice
