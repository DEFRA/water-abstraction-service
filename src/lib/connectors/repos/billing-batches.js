'use strict';

const { BillingBatch } = require('../bookshelf');
const { BATCH_STATUS, BATCH_TYPE } = require('../../models/batch');
const { paginatedEnvelope } = require('./lib/envelope');

const mapModel = model => model ? model.toJSON() : null;

const findRelevantBillingVolumes = billingBatch => {
  for (const invoice of billingBatch.billingInvoices) {
    for (const invoiceLicence of invoice.billingInvoiceLicences) {
      for (const transaction of invoiceLicence.billingTransactions) {
        transaction.chargeElement.billingVolume = transaction.chargeElement.billingVolume.find(
          billingVolume => billingVolume.billingBatchId === billingBatch.billingBatchId);
      }
    }
  }
  return billingBatch;
};

const findOne = async (id) => {
  const model = await BillingBatch
    .forge({ billingBatchId: id })
    .fetch({
      withRelated: [
        'region'
      ]
    });

  return mapModel(model);
};

const findPage = async (page, pageSize) => {
  const result = await BillingBatch
    .forge()
    .orderBy('date_created', 'DESC')
    .fetchPage({
      page,
      pageSize,
      withRelated: [
        'region'
      ]
    });
  return paginatedEnvelope(result);
};

const findByStatuses = async statuses => {
  const batches = await BillingBatch
    .forge()
    .query('whereIn', 'status', statuses)
    .orderBy('date_created', 'desc')
    .fetchAll({ withRelated: ['region'] });

  return batches.toJSON();
};

/**
 * Updates a billing_batch records for the given id
 *
 * @param {String} batchId UUID of the batch to update
 * @param {Object} changes Key values pairs of the changes to make
 */
const update = (batchId, changes) => BillingBatch
  .forge({ billingBatchId: batchId })
  .save(changes);

/**
 * Deletes the billing_batch record with the given id
 *
 * @param {String} batchId UUID of the batch to delete
 */
const deleteById = batchId => BillingBatch
  .forge({ billingBatchId: batchId })
  .destroy();

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
    });

  return mapModel(model);
};

const findOneWithInvoicesWithTransactions = async (id) => {
  const results = await BillingBatch
    .forge({ billingBatchId: id })
    .fetch({
      withRelated: [
        'region',
        'billingInvoices',
        'billingInvoices.billingInvoiceLicences',
        'billingInvoices.billingInvoiceLicences.licence',
        'billingInvoices.billingInvoiceLicences.licence.region',
        'billingInvoices.billingInvoiceLicences.billingTransactions',
        'billingInvoices.billingInvoiceLicences.billingTransactions.chargeElement',
        'billingInvoices.billingInvoiceLicences.billingTransactions.chargeElement.purposeUse',
        'billingInvoices.billingInvoiceLicences.billingTransactions.chargeElement.billingVolume'
      ]
    }).then(model => {
      const billingBatch = mapModel(model);
      return findRelevantBillingVolumes(billingBatch);
    });

  return results;
};

/**
 * Create a new billing batch
 * @param {Object} data - camel case
 */
const create = async data => {
  const model = await BillingBatch
    .forge(data)
    .save();
  return model.toJSON();
};

const findSentTPTBatchesForFinancialYearAndRegion = async (financialYear, regionId) => {
  const filters = {
    status: BATCH_STATUS.sent,
    batch_type: BATCH_TYPE.twoPartTariff,
    to_financial_year_ending: financialYear,
    region_id: regionId
  };
  const batches = await BillingBatch
    .forge()
    .where(filters)
    .fetchAll({
      withRelated: [
        'billingInvoices',
        'billingInvoices.billingInvoiceLicences',
        'billingInvoices.billingInvoiceLicences.licence'
      ]
    });

  return batches.toJSON();
};

exports.delete = deleteById;
exports.findByStatuses = findByStatuses;
exports.findOne = findOne;
exports.findPage = findPage;
exports.update = update;
exports.findOneWithInvoices = findOneWithInvoices;
exports.findOneWithInvoicesWithTransactions = findOneWithInvoicesWithTransactions;
exports.create = create;
exports.findSentTPTBatchesForFinancialYearAndRegion = findSentTPTBatchesForFinancialYearAndRegion;
