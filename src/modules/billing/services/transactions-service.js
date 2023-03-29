'use strict'

const Transaction = require('../../../lib/models/transaction')
const { logger } = require('../../../logger')
const newRepos = require('../../../lib/connectors/repos')
const mappers = require('../mappers')
const { TRANSACTION_TYPE } = require('../../../lib/models/charge-version-year')
const moment = require('moment')
/**
 * Saves a row to water.billing_transactions for the given Transaction
 * instance
 * @param {InvoiceLicence} invoiceLicence
 * @param {Transaction} transaction
 * @return {Promise}
 */
const saveTransactionToDB = (invoiceLicence, transaction) => {
  const data = transaction.scheme === 'sroc'
    ? { ...transaction, billingInvoiceLicenceId: invoiceLicence.id }
    : mappers.transaction.modelToDb(invoiceLicence, transaction)
  const transactionId = transaction.id || transaction.billingTransactionId
  return transactionId
    ? newRepos.billingTransactions.update(transactionId, data)
    : newRepos.billingTransactions.create(data)
}

/**
 * Gets a transaction in its context within a batch
 * @param {String} transactionId
 * @return {Promise<Batch>}
 */
const getById = async transactionId => {
  const data = await newRepos.billingTransactions.findOne(transactionId)
  if (data.scheme === 'sroc') {
    return data
  }
  // Create models
  const batch = mappers.batch.dbToModel(data.billingInvoiceLicence.billingInvoice.billingBatch)
  const invoice = mappers.invoice.dbToModel(data.billingInvoiceLicence.billingInvoice)
  const invoiceLicence = mappers.invoiceLicence.dbToModel(data.billingInvoiceLicence)
  const licence = mappers.licence.dbToModel(data.billingInvoiceLicence.licence)
  const transaction = mappers.transaction.dbToModel(data)

  // Place in heirarchy
  invoiceLicence.transactions = [transaction]
  invoice.invoiceLicences = [invoiceLicence]
  invoiceLicence.licence = licence
  batch.invoices = [
    invoice
  ]

  return batch
}

/**
 * Updates a transaction using the response from the Charge Module
 * create charge API endpoint
 * Either:
 * - the transaction is created successfully, in which case
 *   the charge module transaction ID is stored
 * - a zero value charge is calculated, in which case the
 *   transaction is deleted.
 *
 * @param {String} transactionId
 * @param {Object} response
 */
const updateTransactionWithChargeModuleResponse = (transactionId, response) => {
  const externalId = response.transaction?.id
  if (externalId) {
    return newRepos.billingTransactions.update(transactionId, {
      status: Transaction.statuses.chargeCreated,
      externalId
    })
  }

  const err = new Error('Charge module error')
  logger.error('Unexpected create transaction response from charge module', err.stack, { transactionId, response })
  throw err
}

const setErrorStatus = transactionId =>
  newRepos.billingTransactions.update(transactionId, {
    status: Transaction.statuses.error
  })

const updateDeMinimis = (ids, isDeMinimis) =>
  newRepos.billingTransactions.update(ids, { isDeMinimis }, false)

const getInvoiceTransactions = invoice =>
  invoice.invoiceLicences.map(
    invoiceLicence => invoiceLicence.transactions
  ).flat(Infinity)

const getBatchTransactions = batch => batch.invoices.map(getInvoiceTransactions).flat(Infinity)

const getTransactionId = transaction => transaction.id

// checks to see if the transaction overlaps with the charge version
const isTransactionForTheSamePeriod = (chargeVersionYear, transaction) =>
  moment(chargeVersionYear.chargeVersion.startDate).isSameOrBefore(transaction.endDate) &&
  (chargeVersionYear.chargeVersion.endDate ? moment(chargeVersionYear.chargeVersion.endDate).isSameOrAfter(transaction.startDate) : true)

const getBatchTransactionHistory = async batchId => {
  const historicTransactions = await newRepos.billingTransactions.findHistoryByBatchId(batchId)

  // get licences that need to have the 2nd part recalculated for supplementary
  const twoPartTariffChargeVersionYears = await newRepos.billingBatchChargeVersionYears.findByBatchId(batchId, true)

  // filter the transaction so that it does not include any 2PT transactions where there is no 2PT charge version year
  return historicTransactions.filter(trx =>
    trx.isTwoPartSecondPartCharge
      ? twoPartTariffChargeVersionYears.some(cvy =>
        trx.licenceId === cvy.chargeVersion.licenceId &&
        trx.financialYearEnding === cvy.financialYearEnding &&
        (cvy.transactionType === TRANSACTION_TYPE.twoPartTariff || (!cvy.hasTwoPartAgreement && isTransactionForTheSamePeriod(cvy, trx)) || !cvy.isChargeable))
      : true)
}

/**
 * Persists the state of the transaction isDeMinimis flag to
 * water.billing_transactions
 * @param {Batch} batch
 * @return {Promise}
 */
const persistDeMinimis = batch => {
  const transactions = getBatchTransactions(batch)
  const groups = {
    set: transactions.filter(row => row.isDeMinimis).map(getTransactionId),
    clear: transactions.filter(row => !row.isDeMinimis).map(getTransactionId)
  }
  return Promise.all([
    updateDeMinimis(groups.set, true),
    updateDeMinimis(groups.clear, false)
  ])
}

const updateIsCredited = regionId =>
  newRepos.billingTransactions.updateIsCredited(regionId)

/**
 * Delete one or more transactions by ID
 * @param {String|Array} ids
 * @return {Promise}
 */
const deleteById = ids => newRepos.billingTransactions.delete(ids)

exports.saveTransactionToDB = saveTransactionToDB
exports.getById = getById
exports.updateWithChargeModuleResponse = updateTransactionWithChargeModuleResponse
exports.setErrorStatus = setErrorStatus
exports.persistDeMinimis = persistDeMinimis
exports.deleteById = deleteById
exports.getBatchTransactionHistory = getBatchTransactionHistory
exports.updateIsCredited = updateIsCredited
