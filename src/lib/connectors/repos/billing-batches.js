'use strict'

const { BillingBatch } = require('../bookshelf')
const { BATCH_STATUS } = require('../../models/batch')
const { paginatedEnvelope } = require('./lib/envelope')
const helpers = require('./lib/helpers')
const queries = require('./queries/billing-batches')
const { bookshelf } = require('../bookshelf/bookshelf')

const mapModel = model => model ? model.toJSON() : null

const findOne = async (id) => {
  const model = await BillingBatch
    .forge({ billingBatchId: id })
    .fetch({
      withRelated: [
        'region'
      ]
    })

  return mapModel(model)
}

const findPage = async (page, pageSize) => {
  const result = await BillingBatch
    .forge()
    .where('status', '<>', 'cancel')
    .orderBy('date_created', 'DESC')
    .fetchPage({
      page,
      pageSize,
      withRelated: [
        'region'
      ]
    })
  return paginatedEnvelope(result)
}

const findByStatuses = async statuses => {
  const batches = await BillingBatch
    .forge()
    .query('whereIn', 'status', statuses)
    .orderBy('date_created', 'desc')
    .fetchAll({ withRelated: ['region'] })

  return batches.toJSON()
}

/**
 * Updates a billing_batch records for the given id
 *
 * @param {String} batchId UUID of the batch to update
 * @param {Object} changes Key values pairs of the changes to make
 */
const update = async (batchId, changes) => {
  const result = await BillingBatch
    .forge({ billingBatchId: batchId })
    .save(changes, { method: 'update' })
  return mapModel(result)
}

/**
 * Deletes the billing_batch record with the given id
 *
 * @param {String} batchId UUID of the batch to delete
 * @param {String} isDeletionRequired - boolean
 */
const deleteById = (batchId, isDeletionRequired = true) => BillingBatch
  .forge({ billingBatchId: batchId })
  .destroy({ require: isDeletionRequired })

const findOneWithInvoices = async (id) => {
  const model = await BillingBatch
    .forge({ billingBatchId: id })
    .fetch({
      withRelated: [
        'region',
        'billingInvoices',
        'billingInvoices.billingInvoiceLicences',
        'billingInvoices.billingInvoiceLicences.licence',
        'billingInvoices.billingInvoiceLicences.licence.region'

      ]
    })

  return mapModel(model)
}

const findOneWithInvoicesWithTransactions = async (id) => {
  const model = await BillingBatch
    .forge({ billingBatchId: id })
    .fetch({
      withRelated: [
        'region',
        'billingInvoices',
        'billingInvoices.billingInvoiceLicences',
        'billingInvoices.billingInvoiceLicences.licence',
        'billingInvoices.billingInvoiceLicences.licence.region',
        'billingInvoices.billingInvoiceLicences.billingTransactions',
        'billingInvoices.billingInvoiceLicences.billingTransactions.billingVolume',
        'billingInvoices.billingInvoiceLicences.billingTransactions.chargeElement',
        'billingInvoices.billingInvoiceLicences.billingTransactions.chargeElement.purposeUse'
      ]
    })

  return mapModel(model)
}

/**
 * Create a new billing batch
 * @param {Object} data - camel case
 */
const create = async data => {
  const model = await BillingBatch
    .forge(data)
    .save()
  return model.toJSON()
}

const findByRegionId = async regionId =>
  helpers.findMany(BillingBatch, { region_id: regionId }, ['region'])

const findSentTptBatchesForFinancialYearAndRegion = async (financialYear, regionId, batchType) => {
  const conditions = {
    batch_type: batchType,
    to_financial_year_ending: financialYear,
    status: BATCH_STATUS.sent,
    region_id: regionId
  }
  const withRelated = [
    'billingInvoices',
    'billingInvoices.billingInvoiceLicences',
    'billingInvoices.billingInvoiceLicences.licence'
  ]
  return helpers.findMany(BillingBatch, conditions, withRelated)
}

/**
 * Find all records
 * @return {Promise<Object>}
 */
const find = () => helpers.findMany(BillingBatch)

/**
 * Truncates all tables in water.billing_
 * @return {Promise}
 */
const deleteAllBillingData = () => bookshelf.knex.raw(queries.deleteAllBillingData)

exports.delete = deleteById
exports.findByStatuses = findByStatuses
exports.findOne = findOne
exports.findPage = findPage
exports.update = update
exports.findOneWithInvoices = findOneWithInvoices
exports.findOneWithInvoicesWithTransactions = findOneWithInvoicesWithTransactions
exports.create = create
exports.findByRegionId = findByRegionId
exports.findSentTptBatchesForFinancialYearAndRegion = findSentTptBatchesForFinancialYearAndRegion
exports.find = find
exports.deleteAllBillingData = deleteAllBillingData
