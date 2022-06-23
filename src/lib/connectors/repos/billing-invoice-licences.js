'use strict'

const { bookshelf, BillingInvoiceLicence } = require('../bookshelf')
const raw = require('./lib/raw')
const queries = require('./queries/billing-invoice-licences')
const paginationHelper = require('./lib/envelope')

const withRelated = [
  'billingInvoice',
  'billingInvoice.billingBatch',
  'billingInvoice.billingBatch.region'
]

/**
 * Gets BillingInvoiceLicence and related models by GUID
 * @param {String} id - guid
 * @return {Promise<Object>}
 */
const findOne = async id => {
  const model = await BillingInvoiceLicence
    .forge({ billingInvoiceLicenceId: id })
    .fetch({
      withRelated
    })
  return model ? model.toJSON() : null
}

/**
 * Gets BillingInvoiceLicence and related models for a licence by licenceId
 * where the batch is sent
 * @param {String} licenceId
 * @param {number} page
 * @param {number} perPage
 * @return {Promise<Object>}
 */
const findAll = async (licenceId, page = 1, perPage = 10) => {
  const result = await BillingInvoiceLicence
    .forge()
    .query(function (qb) {
      qb.join('water.billing_invoices', 'water.billing_invoices.billing_invoice_id', '=', 'water.billing_invoice_licences.billing_invoice_id')
      qb.join('water.billing_batches', 'water.billing_invoices.billing_batch_id', '=', 'water.billing_batches.billing_batch_id')
      qb.where({ licence_id: licenceId, 'water.billing_batches.status': 'sent' })
      qb.orderBy('date_created', 'DESC', 'water.billing_invoices.financial_year_ending', 'DESC')
    })
    .fetchPage({
      pageSize: perPage,
      page,
      withRelated
    })

  return paginationHelper.paginatedEnvelope(result)
}

/**
 * Upserts a water.billing_invoice_licences record
 * @param {Object} data - camel case
 */
const upsert = async data => raw.singleRow(queries.upsert, data)

/**
 * Deletes invoice licences in the batch which have no transactions
 * @param {String} batchId
 */
const deleteEmptyByBatchId = batchId =>
  bookshelf.knex.raw(queries.deleteEmptyByBatchId, { batchId })

/**
 * Find One licence in a batch with related transactions
 * @param {String} id
 */
const findOneInvoiceLicenceWithTransactions = async id => {
  const model = await BillingInvoiceLicence
    .forge({ billingInvoiceLicenceId: id })
    .fetch({
      withRelated: [
        'licence',
        'licence.region',
        'billingTransactions',
        'billingTransactions.billingVolume',
        'billingTransactions.chargeElement',
        'billingTransactions.chargeElement.purposeUse'
      ]
    })

  return model.toJSON()
}

/**
 * Delete a single record by ID
 * @param {String} id - one or many IDs
 */
const deleteRecord = billingInvoiceLicenceId => BillingInvoiceLicence
  .forge({ billingInvoiceLicenceId })
  .destroy()

/**
 * Deletes all billing invoice licences for given batch
 * @param {String} batchId - guid
 */
const deleteByBatchId = async batchId => bookshelf.knex.raw(queries.deleteByBatchId, { batchId })

/*
 * Delete multiple by invoice ID
 * @param {String} id - one or many IDs
 */
const deleteByInvoiceId = billingInvoiceId => BillingInvoiceLicence
  .forge()
  .where({ billing_invoice_id: billingInvoiceId })
  .destroy()

const findCountByInvoiceId = billingInvoiceId => BillingInvoiceLicence
  .forge()
  .where({ billing_invoice_id: billingInvoiceId })
  .count()

exports.findOne = findOne
exports.findAll = findAll
exports.deleteEmptyByBatchId = deleteEmptyByBatchId
exports.findOneInvoiceLicenceWithTransactions = findOneInvoiceLicenceWithTransactions
exports.upsert = upsert
exports.delete = deleteRecord
exports.deleteByBatchId = deleteByBatchId
exports.deleteByInvoiceId = deleteByInvoiceId
exports.findCountByInvoiceId = findCountByInvoiceId
