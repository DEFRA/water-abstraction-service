'use strict'

/**
 * @module exports a pure function processBatch() which looks through
 * a supplied list of current batch transactions and historical batch transactions
 * and either flags each for deletion or reversal depending on whether any
 * changes are needed
 */

const { groupBy, negate, flatMap, mapValues } = require('lodash')
const moment = require('moment')
const Decimal = require('decimal.js-light')

const hashers = require('../../../../lib/hash')
const { actions } = require('./constants')

const { isNaldTransaction } = require('../../lib/charge-period')

/**
 * Gets a grouping key for the given transaction - this is to allow
 * similar transactions to be grouped together
 *
 * Similar transactions may have been generated by different charge elements,
 * but they share all the parameters that affect the billed amount
 *
 * @param {Object} transaction
 * @return {String} grouping key
 */
const getGroupingKey = transaction => {
  /**
 * These are the common keys for all transactions when
 * generating a grouping key.
 * TPT and annual transactions have a slightly different
 * grouping key - this list of keys is therefore
 * augmented in the function below
 */
  // Create a list of keys which will form the grouping key
  const keys = {
    source: transaction.source,
    season: transaction.season,
    loss: transaction.loss,
    chargeType: transaction.chargeType,
    section126Factor: transaction.section126Factor,
    section127Agreement: transaction.section127Agreement,
    section130Agreement: transaction.section130Agreement,
    isTwoPartSecondPartCharge: transaction.isTwoPartSecondPartCharge,
    invoiceAccountNumber: transaction.invoiceAccountNumber,
    financialYearEnding: transaction.financialYearEnding
  }

  if (transaction.isTwoPartSecondPartCharge) {
    keys.isSummer = transaction.isSummer
  } else {
    keys.authorisedDays = transaction.authorisedDays
    keys.volume = transaction.volume
  }

  // The 'new licence' flag only affects WRLS transactions so it does not
  // need to be incorporated into the key for NALD transactions
  if (!isNaldTransaction(transaction.startDate)) {
    keys.isNewLicence = transaction.isNewLicence
  }

  /**
 * These are the keys in the abstractionPeriod field
 * By specifying the keys we guarantee their ordering
 */
  const abstractionPeriod = {
    startDay: transaction.abstractionPeriod.startDay,
    startMonth: transaction.abstractionPeriod.startMonth,
    endDay: transaction.abstractionPeriod.endDay,
    endMonth: transaction.abstractionPeriod.endMonth
  }

  // Get the data and serialize to a JSON string
  const data = {
    ...keys,
    chargeElementPurposeUseCode: transaction.chargeElementPurposeUseCode,
    abstractionPeriod
  }
  return hashers.createMd5Hash(JSON.stringify(data))
}

const xor = (a, b) => a ? !b : b

/**
 * Maps an array of transactions to a data structure which includes a summed total
 *
 * The summed total sums:
 * - billable days in the group (for annual)
 * - volumes in the group (for TPT)
 *
 * Depending on whether the transaction is a credit, and whether it is in the current
 * batch, it is negated.  This means where a transaction in a sent batch has the
 * same billable days/volume as one in the current batch, they will sum to zero
 * and the transaction in the current batch will then be deleted.
 *
 * If the sum is non-zero, then transactions will remain in the current batch.
 *
 * @param {String} batchId
 * @param {Array<Object>} transactions
 * @return {Object} data structure containing { transactions: [], sum }
 */
const mapTransactionGroup = (batchId, transactions) => transactions.reduce((acc, transaction) => {
  const isCurrentBatch = transaction.billingBatchId === batchId
  const propertyKey = transaction.isTwoPartSecondPartCharge ? 'volume' : 'billableDays'
  const propertyValue = transaction[propertyKey] || 0
  let value = new Decimal(propertyValue)
  if (xor(transaction.isCredit, !isCurrentBatch)) {
    value = value.negated()
  }
  return {
    transactions: [...acc.transactions, {
      ...transaction,
      isCurrentBatch,
      action: null
    }],
    sum: acc.sum.plus(value)
  }
}, {
  transactions: [],
  sum: new Decimal(0)
})

/**
 * Predicate to check if this transaction should be considered.
 *
 * We only wish to consider standard and compensation charges.
 * Minumum charge correction transactions are omitted.
 *
 * @param {Object} transaction
 * @return {Boolean}
 */
const isValidTransaction = transaction =>
  ['standard', 'compensation'].includes(transaction.chargeType)

/**
 * Predicate to check if transaction is part of the current batch
 *
 * @param {Object} transaction
 * @return {Boolean}
 */
const isCurrentBatchTransaction = transaction => transaction.isCurrentBatch

/**
 * Predicate to check if transaction is part of an existing batch
 *
 * @param {Object} transaction
 * @return {Boolean}
 */
const isExistingBatchTransaction = negate(isCurrentBatchTransaction)

/**
 * Deletes all transactions in the given group that are
 * in the current batch
 *
 * @param {Object} group
 * @param {Array<Object>} group.transactions
 * @return {Promise}
 */
const markCurrentBatchTransactionsForDeletion = group => {
  group.transactions
    .filter(isCurrentBatchTransaction)
    .forEach(transaction => {
      transaction.action = actions.deleteTransaction
    })
}

/**
 * Gets a key for pairing transactions within a group which have the same:
 * - Charge period
 * - Billable days (for annual transactions)
 * - Volume (for TPT transactions)
 *
 * @param {Object} transaction
 * @return {String}
 */
const getPairGroupingKey = transaction => {
  const transactionDetails = { startDate: transaction.startDate, endDate: transaction.endDate }
  if (transaction.isTwoPartSecondPartCharge) {
    transactionDetails.volume = transaction.volume
  } else {
    transactionDetails.billableDays = transaction.billableDays
  }
  return JSON.stringify(transactionDetails)
}

/**
 * Filters cancelling transactions in the supplied list
 *
 * The transactions are sorted by date created, and then reduced to the minumum amount
 * of credits/charges to have the same financial effect
 *
 * The transactions supplied should already be sorted into a similar group
 *
 * E.g.
 *
 * Charge transaction - remove
 * Credit transaction - remove
 * Charge transaction - keep
 *
 * @param {Array<Object>} transactions
 * @return {Array<Object>}
 */
const filterCancellingTransactions = transactions => {
  transactions
    .sort((a, b) => {
      return moment(a.dateCreated).unix() - moment(b.dateCreated).unix()
    })

  return transactions
    .reduce((acc, transaction) => {
      const index = acc.findIndex(row => row.isCredit === !transaction.isCredit)
      index === -1 ? acc.push(transaction) : acc.splice(index, 1)
      return acc
    }, [])
}

/**
 * Looks at all the transactions in a group, and returns a new array of
 * transasctions with "pairs" (e.g. credits and charges that cancel each other)
 * removed
 *
 * @param {Array<Object>} transactions
 * @return {Array<Object>} transactions with cancelling pairs removed
 */
const getNonCancellingTransactions = transactions => {
  const pairGroups = groupBy(transactions, getPairGroupingKey)
  const filteredGroups = mapValues(pairGroups, filterCancellingTransactions)
  return flatMap(Object.values(filteredGroups))
}

/**
 * Updates a transaction in the current batch
 *
 * @param {Object} transaction
 * @param {Decimal} sum
 * @return {Promise}
 */
const markExistingBatchTransactionsForReversal = async group => {
  const existingBatchTransactions = group.transactions.filter(isExistingBatchTransaction)

  // Get a list of transactions to reverse
  const effectiveTransactions = getNonCancellingTransactions(existingBatchTransactions)
  if (effectiveTransactions.length === 0) {
    return
  }

  // Create invoice and invoice licence
  effectiveTransactions.forEach(transaction => {
    transaction.action = actions.reverseTransaction
  })
}

/**
 * Processes a transaction group and takes one of 3 actions:
 *
 * - Removes all transactions in the current batch if the sum is zero
 * - Updates the transaction in the current batch if found to create a zero sum
 * - Creates a new transaction by copying one from a previous batch to create a zero sum
 *
 * @param {Object} group
 * @param {Array} group.transactions
 * @param {Decimal} group.sum
 * @return {Promise}
 */
const processTransactionGroup = async (batchId, group) => {
  // If group sums to zero, we don't need any adjustments in this group.
  // Flag current batch transactions for deletion
  if (group.sum.equals(0)) {
    return markCurrentBatchTransactionsForDeletion(group)
  } else {
    // Otherwise we flag historical transactions in the group to be reversed
    // so that the customer will net
    // have only been charged the correct transactions generated by the
    // current batch
    return markExistingBatchTransactionsForReversal(group)
  }
}

const getTransactions = group => group.transactions

/**
 * Processes the supplementary billing batch specified by
 * deleting some transactions in the batch and crediting others
 * previously billed
 * @param {String} batchId
 * @param {Array<Object>} transactions
 * @reutrn {Array<Object>}
 */
const processBatch = (batchId, transactions) => {
  // Valid transactions excludes min charge transactions
  const validTransactions = transactions.filter(isValidTransaction)

  // Group transactions
  const transactionGroups = mapValues(
    groupBy(validTransactions, getGroupingKey),
    groupTransactions => mapTransactionGroup(batchId, groupTransactions)
  )

  for (const key in transactionGroups) {
    processTransactionGroup(batchId, transactionGroups[key])
  }

  // Convert data structure back to a flat array of transactions
  return flatMap(
    Object.values(transactionGroups).map(getTransactions)
  )
}

exports.processBatch = processBatch
