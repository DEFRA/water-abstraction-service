'use strict'

// Models
const Transaction = require('../../../../lib/models/transaction')

// Services
const billingTransactionsRepo = require('../../../../lib/connectors/repos/billing-transactions')
const invoiceService = require('../../../../lib/services/invoice-service')
const invoiceLicencesService = require('../invoice-licences-service')
const transactionService = require('../transactions-service')

const { actions } = require('./constants')

const { groupBy } = require('../../../../lib/object-helpers')

/**
 * These are the keys we wish to pick from the source
 * transaction object when creating a reversed transaction
 * before attempting to write the transaction back to the DB
 */
const getReversedTransaction = (invoiceLicence, sourceTransaction) => {
  return {
    billingInvoiceLicenceId: invoiceLicence.id,
    chargeElementId: sourceTransaction.chargeElementId,
    startDate: sourceTransaction.startDate,
    endDate: sourceTransaction.endDate,
    abstractionPeriod: sourceTransaction.abstractionPeriod,
    source: sourceTransaction.source,
    season: sourceTransaction.season,
    loss: sourceTransaction.loss,
    netAmount: sourceTransaction.netAmount,
    isCredit: !sourceTransaction.isCredit,
    chargeType: sourceTransaction.chargeType,
    authorisedQuantity: sourceTransaction.authorisedQuantity,
    billableQuantity: sourceTransaction.billableQuantity,
    authorisedDays: sourceTransaction.authorisedDays,
    billableDays: sourceTransaction.billableDays,
    status: Transaction.statuses.candidate,
    description: sourceTransaction.description,
    externalId: null,
    volume: sourceTransaction.volume,
    section126Factor: sourceTransaction.section126Factor,
    section127Agreement: sourceTransaction.section127Agreement,
    section130Agreement: sourceTransaction.section130Agreement,
    isDeMinimis: sourceTransaction.isDeMinimis,
    isNewLicence: sourceTransaction.isNewLicence,
    legacyId: null,
    sourceTransactionId: sourceTransaction.billingTransactionId,
    isTwoPartSecondPartCharge: sourceTransaction.isTwoPartSecondPartCharge
  }
}

// this fixes 3044 for when credits were not being created
const isNotRebillingTransaction = transaction => !(['reversal', 'rebilled'].includes(transaction.rebillingState))
// this fixes 3500 where the incorrect extra invoice was created in a supplementary bill run for rebilling.
const filterRebillingTransactions = (batchTransactions, historicalTransactions) => {
  // find all rebill transactions in the current batch
  const rebillBatchTransactions = batchTransactions.filter(transaction => transaction.rebillingState === 'rebill')
  if (rebillBatchTransactions.length === 0) {
    const transactions = [...batchTransactions, ...historicalTransactions]
    // if tere are no rebill invoices in the current batch then it is
    // not necessary to do the more complex filtering below.
    return transactions.filter(isNotRebillingTransaction)
  }
  // if the current batch includes a rebill invoice then do not filter out the rebilled invoice
  // becasue it will not cancel out and then create another invoice for the charge version year
  const filteredHistoricTransactions = historicalTransactions.filter(transaction => {
    if (['unrebillable', null, 'rebill'].includes(transaction.rebillingState)) {
      return true
    } else if (transaction.rebillingState === 'rebilled') {
      return (rebillBatchTransactions.filter(trx => {
        return !!(
          trx.invoiceAccountNumber === transaction.invoiceAccountNumber &&
          trx.licenceId === transaction.licenceId &&
          trx.chargeElementId === transaction.chargeElementId
        )
      }).length > 0)
    }
    // this will filter out reversals in historic batches
    return false
  })
  return [...(batchTransactions.filter(isNotRebillingTransaction)), ...filteredHistoricTransactions]
}

/**
 * Gets a list of transactions in the current batch plus historical transactions
 * for the licences in the supplementary batch
 *
 * @param {String} batchId
 * @return {Promise<Array>}
 */
const getTransactions = async batchId => {
  const batchTransactions = await billingTransactionsRepo.findByBatchId(batchId)
  const historicalTransactions = await transactionService.getBatchTransactionHistory(batchId)
  return filterRebillingTransactions(batchTransactions, historicalTransactions)
}

/**
 * Gets transaction ID from transaction
 *
 * @param {Object} transaction
 * @return {String}
 */
const getTransactionId = transaction => transaction.billingTransactionId

const isMarkedForDeletion = transaction => transaction.action === actions.deleteTransaction

const isMarkedForReversal = transaction => transaction.action === actions.reverseTransaction

const getInvoiceKey = transaction =>
  `${transaction.financialYearEnding}_${transaction.invoiceAccountId}`

const getLicenceId = transaction => transaction.licenceId

const reverseInvoiceLicenceTransactions = async (invoiceLicence, transactions) => {
  for (const transaction of transactions) {
    const data = getReversedTransaction(invoiceLicence, transaction)
    await billingTransactionsRepo.create(data)
  }
}

const reverseTransactions = async (batchId, transactions) => {
  const validTransactions = transactions.filter(isMarkedForReversal)

  // Group by invoice
  const invoiceGroups = groupBy(validTransactions, getInvoiceKey)

  for (const invoiceKey in invoiceGroups) {
    const [financialYearEnding, invoiceAccountId] = invoiceKey.split('_')

    // Get/create invoice in current batch
    const invoice = await invoiceService.getOrCreateInvoice(
      batchId, invoiceAccountId, parseInt(financialYearEnding)
    )

    // Group transactions by licence
    const licenceGroups = groupBy(invoiceGroups[invoiceKey], getLicenceId)

    // For each licence in the group
    for (const licenceId in licenceGroups) {
      const invoiceLicenceTransactions = licenceGroups[licenceId]

      // Get/create invoice licence in current batch
      const [{ licenceRef }] = invoiceLicenceTransactions
      const invoiceLicence = await invoiceLicencesService.getOrCreateInvoiceLicence(
        invoice.id, licenceId, licenceRef
      )

      // Create reversed transations in the invoice licence
      await reverseInvoiceLicenceTransactions(invoiceLicence, invoiceLicenceTransactions)
    }
  }
}

const deleteTransactions = transactions => {
  // Find transaction IDs flagged for deletion
  const ids = transactions
    .filter(isMarkedForDeletion)
    .map(getTransactionId)

  // Delete if >0 records to delete
  if (ids.length === 0) {
    return null
  }

  return billingTransactionsRepo.delete(ids)
}

const persistChanges = async (batchId, transactions) => {
  await deleteTransactions(transactions)
  await reverseTransactions(batchId, transactions)
}

exports.getTransactions = getTransactions
exports.persistChanges = persistChanges
